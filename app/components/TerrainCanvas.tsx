'use client';

import { useRef, useMemo, useCallback, memo, useEffect } from 'react';
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
} from 'reactflow';
import 'reactflow/dist/style.css';
import { nodeTypes } from './NodeTypes';

interface TerrainCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  onViewportChange?: (viewport: Viewport) => void;
}

function TerrainCanvasInner({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onViewportChange,
}: TerrainCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReactFlowInstance | null>(null);
  const prevNodeCount = useRef(0);

  const handleInit = useCallback((instance: ReactFlowInstance) => {
    instanceRef.current = instance;
    prevNodeCount.current = nodes.length;
    if (nodes.length > 0) {
      setTimeout(() => {
        instance.fitView({ padding: 0.4, duration: 500 });
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Every time nodes are added, refit
  useEffect(() => {
    if (nodes.length === 0) {
      prevNodeCount.current = 0;
      return;
    }
    if (nodes.length !== prevNodeCount.current) {
      prevNodeCount.current = nodes.length;
      const doFit = () => {
        const instance = instanceRef.current;
        if (!instance) return;
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0 || rect.height === 0) {
          // Container not yet laid out — retry once
          setTimeout(() => instance.fitView({ padding: 0.4, duration: 500 }), 150);
          return;
        }
        instance.fitView({ padding: 0.4, duration: 500 });
      };
      const tid = setTimeout(doFit, 200);
      return () => clearTimeout(tid);
    }
  }, [nodes.length]);

  const handleMove: OnMove = useCallback(
    (_event, vp: Viewport) => {
      onViewportChange?.(vp);
    },
    [onViewportChange]
  );

  const displayNodes = useMemo(() => nodes, [nodes]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={displayNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onMove={handleMove}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.Straight}
        defaultEdgeOptions={{ type: 'straight' }}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        nodesDraggable
        nodesConnectable={!!onConnect}
        elementsSelectable={false}
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