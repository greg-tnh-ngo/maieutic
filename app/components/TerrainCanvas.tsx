'use client';

import { useRef, useMemo, useCallback, memo, useEffect, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Background,
  BackgroundVariant,
  Viewport,
  OnMove,
  ConnectionLineType,
  ReactFlowInstance,
  NodeMouseHandler,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './NodeTypes';
import { edgeTypes } from './EdgeTypes';

const EDGE_NEW_THRESHOLD = 5000; // ms — edges younger than this use animated edge type

interface TerrainCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onViewportChange?: (viewport: Viewport) => void;
  onNodeClick?: (node: Node) => void;
  /** Height in px occupied by the bottom overlay — excluded from fitView area */
  bottomOffset?: number;
  /** Width in px occupied by the right pane — excluded from fitView area */
  rightOffset?: number;
  /** Node IDs to highlight with a pulse animation */
  pulsedNodeIds?: string[];
}

function TerrainCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onViewportChange,
  onNodeClick,
  bottomOffset = 180,
  rightOffset = 0,
  pulsedNodeIds = [],
}: TerrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const prevNodeCount = useRef(0);
  const prevEdgeCount = useRef(0);

  // Tick for createdAt-based visual weight
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  // Hover state
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const fitView = useCallback(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) {
      setTimeout(() => fitView(), 150);
      return;
    }
    instance.fitView({ padding: 0.35, duration: 500 });
    // Post-fit: shift viewport to account for bottom overlay and right pane
    setTimeout(() => {
      const vp = instance.getViewport();
      const dx = -rightOffset / 2;
      const dy = -bottomOffset / 4;
      if (dx !== 0 || dy !== 0) {
        instance.setViewport({ ...vp, x: vp.x + dx, y: vp.y + dy }, { duration: 300 });
      }
    }, 520);
  }, [bottomOffset, rightOffset]);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    prevNodeCount.current = nodes.length;
    prevEdgeCount.current = edges.length;
    if (nodes.length > 0) {
      setTimeout(() => fitView(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refit when nodes or edges are added
  useEffect(() => {
    const nodeChanged = nodes.length !== prevNodeCount.current;
    const edgeChanged = edges.length !== prevEdgeCount.current;
    prevNodeCount.current = nodes.length;
    prevEdgeCount.current = edges.length;
    if (!nodeChanged && !edgeChanged) return;
    if (nodes.length === 0) return;
    const tid = setTimeout(() => fitView(), 200);
    return () => clearTimeout(tid);
  }, [nodes.length, edges.length, fitView]);

  // Build edge lookup for hover: edgeId → {source, target}
  const edgeNodeMap = useMemo(() => {
    const m = new Map<string, { source: string; target: string }>();
    edges.forEach(e => m.set(e.id, { source: e.source, target: e.target }));
    return m;
  }, [edges]);

  // Compute display nodes with visual weight + hover + pulse styles
  const displayNodes = useMemo(() => {
    const hoveredEdge = hoveredEdgeId ? edgeNodeMap.get(hoveredEdgeId) : null;

    return nodes.map(node => {
      const isNew = node.data?.createdAt && (now - node.data.createdAt) < 3000;
      const isPulsed = pulsedNodeIds.includes(node.id);

      let opacity = isNew ? 1 : 0.75;
      let className = '';

      if (hoveredNodeId) {
        if (node.id === hoveredNodeId) {
          opacity = 1;
          className = 'node-hovered';
        } else {
          opacity = 0.25;
        }
      } else if (hoveredEdge) {
        if (node.id === hoveredEdge.source || node.id === hoveredEdge.target) {
          opacity = 1;
          className = 'node-hovered';
        } else {
          opacity = 0.25;
        }
      }

      if (isPulsed) className = (className + ' node-pulsing').trim();

      return {
        ...node,
        className,
        style: { ...node.style, opacity, transition: 'opacity 200ms ease' },
      };
    });
  }, [nodes, now, hoveredNodeId, hoveredEdgeId, edgeNodeMap, pulsedNodeIds]);

  // Compute display edges with visual weight + hover styles + animated type for new edges
  const displayEdges = useMemo(() => {
    const hoveredEdge = hoveredEdgeId ? edgeNodeMap.get(hoveredEdgeId) : null;

    return edges.map(edge => {
      const isNew = edge.data?.createdAt && (now - edge.data.createdAt) < EDGE_NEW_THRESHOLD;
      const useAnimated = edge.data?.createdAt && (now - edge.data.createdAt) < EDGE_NEW_THRESHOLD;

      let strokeOpacity = isNew ? 1 : 0.7;
      const baseStroke = edge.data?.edgeKind === 'contradiction'
        ? '#8b2020'
        : isNew ? 'rgba(232,232,240,0.55)' : 'rgba(232,232,240,0.3)';

      if (hoveredNodeId) {
        const connected = edge.source === hoveredNodeId || edge.target === hoveredNodeId;
        if (connected) {
          strokeOpacity = 1;
        } else {
          strokeOpacity = 0.1;
        }
      } else if (hoveredEdge) {
        if (edge.id === hoveredEdgeId) {
          strokeOpacity = 1;
        } else {
          strokeOpacity = 0.1;
        }
      }

      return {
        ...edge,
        type: useAnimated ? 'animated' : 'straight',
        style: {
          ...edge.style,
          stroke: baseStroke,
          strokeWidth: edge.id === hoveredEdgeId ? 2 : 1,
          opacity: strokeOpacity,
          transition: 'opacity 200ms ease, stroke-width 200ms ease',
        },
      };
    });
  }, [edges, now, hoveredNodeId, hoveredEdgeId, edgeNodeMap]);

  const handleMove: OnMove = useCallback(
    (_event, vp: Viewport) => { onViewportChange?.(vp); },
    [onViewportChange]
  );

  const handleNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => { onNodeClick?.(node); },
    [onNodeClick]
  );

  const handleNodeMouseEnter: NodeMouseHandler = useCallback(
    (_event, node) => { setHoveredNodeId(node.id); setHoveredEdgeId(null); },
    []
  );

  const handleNodeMouseLeave: NodeMouseHandler = useCallback(
    () => { setHoveredNodeId(null); },
    []
  );

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMove={handleMove}
        onInit={handleInit}
        onNodeClick={handleNodeClick}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={handleNodeMouseLeave}
        onEdgeMouseEnter={(_event, edge) => { setHoveredEdgeId(edge.id); setHoveredNodeId(null); }}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        connectionLineType={ConnectionLineType.Straight}
        defaultEdgeOptions={{ type: 'straight' }}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        nodesDraggable
        nodesConnectable={!!onConnect}

        proOptions={{ hideAttribution: true }}
        style={{ background: 'transparent' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          color="rgba(232,232,240,0.05)"
          gap={28}
          size={1}
        />
      </ReactFlow>
    </div>
  );
}

const TerrainCanvas = memo(TerrainCanvasInner);
export default TerrainCanvas;
