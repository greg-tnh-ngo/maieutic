'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Node, Edge, useNodesState, useEdgesState, OnConnect, addEdge, ReactFlowProvider } from 'reactflow';
import { useDemoController } from './DemoController';
import TerrainCanvas from './TerrainCanvas';
import IntakeZone from './IntakeZone';
import SynthesisPanel from './SynthesisPanel';
import NodeDetailPane from './NodeDetailPane';
import HistoryPanel, { HistoryEntry } from './HistoryPanel';
import { SynthesisData, LUCAS_RESPONSE_1, LUCAS_RESPONSE_2, AI_QUESTION_1, AI_QUESTION_2 } from '../lib/demo-script';
import { spreadNodes, findFreePosition } from '../lib/terrain-utils';

type Phase = 'intake' | 'exploration' | 'synthesis';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface Notification {
  id: string;
  lines: string[];
  born: number;
}

// ─── Button style shared by synthesis / history / unexplored buttons ─────────
const TOP_BTN: React.CSSProperties = {
  color: 'rgba(232,232,240,0.3)',
  background: 'none',
  border: '1px solid rgba(232,232,240,0.1)',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  fontFamily: 'system-ui, sans-serif',
  padding: '6px 14px',
  cursor: 'pointer',
  transition: 'all 0.2s',
  animation: 'fade-in 0.4s ease',
};

function AppInner({ isDemo }: { isDemo: boolean }) {
  const router = useRouter();
  const demo = useDemoController(isDemo);

  // ── Demo L-key: skip animation or advance ──────────────────────────────────
  useEffect(() => {
    if (!isDemo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l') demo.advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDemo, demo.advance]);

  // ── Live mode state ────────────────────────────────────────────────────────
  const [livePhase, setLivePhase] = useState<Phase>('intake');
  const [liveNodes, setLiveNodes, onLiveNodesChange] = useNodesState([]);
  const [liveEdges, setLiveEdges, onLiveEdgesChange] = useEdgesState([]);
  const [liveQuestion, setLiveQuestion] = useState<string | null>(null);
  const [liveResponse, setLiveResponse] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);
  const [_interventionCount, setInterventionCount] = useState(0);
  const [liveSynthesis, setLiveSynthesis] = useState<SynthesisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nodeCountRef = useRef(0);

  // ── Shared ─────────────────────────────────────────────────────────────────
  const phase: Phase = isDemo ? demo.phase : livePhase;
  const nodes: Node[] = isDemo ? demo.nodes : liveNodes;
  const edges: Edge[] = isDemo ? demo.edges : liveEdges;
  const currentQuestion = isDemo ? demo.currentQuestion : liveQuestion;
  const synthesisData = isDemo ? demo.synthesisData : liveSynthesis;

  // ── Notifications ──────────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = useCallback((lines: string[]) => {
    const id = `n-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, lines, born: Date.now() }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, []);

  // ── History ────────────────────────────────────────────────────────────────
  const [historyLog, setHistoryLog] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const pushHistory = useCallback((entry: Omit<HistoryEntry, 'id'>) => {
    setHistoryLog(prev => [...prev, { id: `h-${Date.now()}-${Math.random()}`, ...entry }]);
  }, []);

  // ── Panel state ────────────────────────────────────────────────────────────
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const unexploredLabel = isDemo ? demo.unexploredZoneLabel : '';
  const selectedNode: Node | null = nodes.find(n => n.id === selectedNodeId)
    ?? (selectedNodeId === '__unexplored__' ? {
        id: '__unexplored__',
        type: 'ghost',
        position: { x: 0, y: 0 },
        data: {
          label: unexploredLabel || 'unexplored territory',
          note: 'A zone between clusters with no connections. What exists in this space that has not been named?',
        },
      } as Node
    : null);
  const rightPaneOpen = !!selectedNode;

  // ── Pulsed nodes (history highlight) ──────────────────────────────────────
  const [pulsedNodeIds, setPulsedNodeIds] = useState<string[]>([]);
  const handleHighlightNodes = useCallback((ids: string[]) => {
    setPulsedNodeIds(ids);
    setTimeout(() => setPulsedNodeIds([]), 1100);
  }, []);

  // ── Demo: diff nodes/edges for notifications + history ────────────────────
  const prevDemoNodes = useRef<Node[]>([]);
  const prevDemoEdges = useRef<Edge[]>([]);
  const prevDemoQuestion = useRef<string | null>(null);
  const prevDemoResponse = useRef<string>('');

  useEffect(() => {
    if (!isDemo) return;

    // New nodes
    const prevIds = new Set(prevDemoNodes.current.map(n => n.id));
    const newNodes = nodes.filter(n => !prevIds.has(n.id));
    if (newNodes.length > 0) {
      const lines = newNodes.map(n => `intuited — ${n.data.label} (${n.type})`);
      addNotification(lines);
      pushHistory({ nodeLabels: newNodes.map(n => n.data.label) });
    }
    prevDemoNodes.current = nodes;

    // New edges
    const prevEdgeIds = new Set(prevDemoEdges.current.map(e => e.id));
    const newEdges = edges.filter(e => !prevEdgeIds.has(e.id));
    if (newEdges.length > 0) {
      const nodeMap = new Map(nodes.map(n => [n.id, n.data.label as string]));
      const lines = newEdges.map(e => `linked ${nodeMap.get(e.source) ?? e.source} → ${nodeMap.get(e.target) ?? e.target}`);
      addNotification(lines);
      newEdges.forEach(e => {
        pushHistory({ edgeDesc: `linked ${nodeMap.get(e.source) ?? e.source} → ${nodeMap.get(e.target) ?? e.target}` });
      });
    }
    prevDemoEdges.current = edges;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, isDemo]);

  // Demo question/response history
  useEffect(() => {
    if (!isDemo) return;
    if (demo.currentQuestion && demo.currentQuestion !== prevDemoQuestion.current) {
      prevDemoQuestion.current = demo.currentQuestion;
    }
  }, [demo.currentQuestion, isDemo]);

  useEffect(() => {
    if (!isDemo) return;
    if (!demo.isTypingResponse && demo.simulatedResponse && demo.simulatedResponse !== prevDemoResponse.current) {
      prevDemoResponse.current = demo.simulatedResponse;
      if (prevDemoQuestion.current) {
        pushHistory({ question: prevDemoQuestion.current, response: demo.simulatedResponse });
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo.isTypingResponse, demo.simulatedResponse, isDemo]);

  // ── Live: intake submit ────────────────────────────────────────────────────
  const handleIntakeSubmit = useCallback(async (text: string) => {
    setIsLoading(true);
    setLivePhase('exploration');
    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json() as {
        firstPrompt: string;
        initialNodes: Array<{ id: string; label: string; type: string; position: { x: number; y: number } }>;
        initialEdges: Array<{ source: string; target: string; type: string }>;
      };
      const now = Date.now();
      const rawNodes = data.initialNodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { label: n.label, createdAt: now },
      }));
      const rfNodes = spreadNodes(rawNodes);
      nodeCountRef.current = rfNodes.length;
      setLiveNodes(rfNodes);
      if (rfNodes.length > 0) {
        addNotification(rfNodes.map(n => `intuited — ${n.data.label} (${n.type})`));
        pushHistory({ nodeLabels: rfNodes.map(n => n.data.label) });
      }
      const rfEdges = data.initialEdges.map(e => ({
        id: `${e.source}--${e.target}`,
        source: e.source,
        target: e.target,
        data: { edgeKind: e.type, createdAt: now },
        style: {
          stroke: e.type === 'contradiction' ? '#8b2020' : 'rgba(232,232,240,0.25)',
          strokeWidth: 1,
          strokeDasharray: e.type === 'dotted' ? '5 5' : undefined,
        },
        animated: false,
      }));
      setLiveEdges(rfEdges);
      setLiveQuestion(data.firstPrompt);
      setLiveTranscript([{ role: 'assistant', content: data.firstPrompt }]);
    } catch (err) {
      console.error(err);
      setLiveQuestion('What are you trying to make?');
    } finally {
      setIsLoading(false);
    }
  }, [setLiveNodes, setLiveEdges, addNotification, pushHistory]);

  // ── Live: response submit ──────────────────────────────────────────────────
  const handleResponseSubmit = useCallback(async () => {
    if (!liveResponse.trim() || isLoading) return;
    const text = liveResponse.trim();
    setLiveResponse('');
    setLiveQuestion(null);
    setIsLoading(true);
    const newTranscript: TranscriptEntry[] = [...liveTranscript, { role: 'user', content: text }];
    setLiveTranscript(newTranscript);
    try {
      const res = await fetch('/api/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: liveNodes, edges: liveEdges, transcript: newTranscript }),
      });
      const intervention = await res.json() as {
        interventionType: 'node' | 'edge' | 'question';
        payload: Record<string, unknown>;
      };
      setInterventionCount(c => c + 1);
      const now = Date.now();
      if (intervention.interventionType === 'node') {
        const p = intervention.payload;
        setLiveNodes(prev => {
          const hint = p.position as { x: number; y: number } | undefined;
          const pos = findFreePosition(prev, hint ?? { x: 300 + prev.length * 30, y: 250 });
          const newNode: Node = {
            id: p.id as string,
            type: (p.type as string) ?? 'ghost',
            position: pos,
            data: { label: p.label, note: p.note, createdAt: now },
          };
          addNotification([`intuited — ${p.label} (${newNode.type})`]);
          pushHistory({ nodeLabels: [p.label as string] });
          return [...prev, newNode];
        });
      } else if (intervention.interventionType === 'edge') {
        const p = intervention.payload;
        const edgeType = p.type as string;
        const newEdge: Edge = {
          id: `${p.source}--${p.target}`,
          source: p.source as string,
          target: p.target as string,
          data: { edgeKind: edgeType, createdAt: now },
          style: {
            stroke: edgeType === 'contradiction' ? '#8b2020' : 'rgba(232,232,240,0.25)',
            strokeWidth: 1,
            strokeDasharray: edgeType === 'dotted' ? '5 5' : undefined,
          },
          animated: false,
        };
        const nodeMap = new Map(liveNodes.map(n => [n.id, n.data.label as string]));
        addNotification([`linked ${nodeMap.get(p.source as string) ?? p.source} → ${nodeMap.get(p.target as string) ?? p.target}`]);
        pushHistory({ edgeDesc: `linked ${nodeMap.get(p.source as string) ?? p.source} → ${nodeMap.get(p.target as string) ?? p.target}` });
        setLiveEdges(prev => [...prev, newEdge]);
      } else if (intervention.interventionType === 'question') {
        const question = (intervention.payload.question as string) ?? 'What remains unresolved here?';
        setLiveQuestion(question);
        setLiveTranscript(t => [...t, { role: 'assistant', content: question }]);
      }
    } catch (err) {
      console.error(err);
      setLiveQuestion('What is this circling around without naming?');
    } finally {
      setIsLoading(false);
    }
  }, [liveResponse, isLoading, liveTranscript, liveNodes, liveEdges, setLiveNodes, setLiveEdges, addNotification, pushHistory]);

  // ── Live: connect nodes manually ──────────────────────────────────────────
  const onConnect: OnConnect = useCallback(
    connection => setLiveEdges(prev => addEdge({
      ...connection,
      data: { edgeKind: 'solid', createdAt: Date.now() },
      style: { stroke: 'rgba(232,232,240,0.25)', strokeWidth: 1 },
      animated: false,
    }, prev)),
    [setLiveEdges]
  );

  // ── Synthesis ──────────────────────────────────────────────────────────────
  const handleOpenSynthesis = useCallback(async () => {
    if (isDemo) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/synthesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodes: liveNodes, edges: liveEdges, transcript: liveTranscript }),
      });
      const data = await res.json() as SynthesisData;
      setLiveSynthesis(data);
      setLivePhase('synthesis');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [isDemo, liveNodes, liveEdges, liveTranscript]);

  // ── Node interactions ──────────────────────────────────────────────────────
  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNodeId(prev => prev === node.id ? null : node.id);
  }, []);

  const handleEdgeClick = useCallback((edge: Edge) => {
    handleHighlightNodes([edge.source, edge.target]);
  }, [handleHighlightNodes]);

  const handleDeleteNode = useCallback((id: string) => {
    if (isDemo) return;
    setLiveNodes(prev => prev.filter(n => n.id !== id));
    setLiveEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
  }, [isDemo, setLiveNodes, setLiveEdges]);

  const handleUpdateLabel = useCallback((id: string, label: string) => {
    if (isDemo) return;
    setLiveNodes(prev => prev.map(n => n.id === id ? { ...n, data: { ...n.data, label } } : n));
  }, [isDemo, setLiveNodes]);

  const handleGhostSubmit = useCallback((nodeId: string, response: string) => {
    if (isDemo) {
      // In demo mode, just close the pane — auto-advance handles subsequent steps
      setSelectedNodeId(null);
      return;
    }
    // Convert ghost to concept
    setLiveNodes(prev => prev.map(n =>
      n.id === nodeId ? { ...n, type: 'concept', data: { ...n.data, originResponse: response } } : n
    ));
    setSelectedNodeId(null);
    // Trigger intervention
    const ghost = liveNodes.find(n => n.id === nodeId);
    if (ghost) {
      setLiveQuestion(null);
      setLiveTranscript(t => [...t, { role: 'user', content: response }]);
      setIsLoading(true);
      fetch('/api/intervention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: liveNodes,
          edges: liveEdges,
          transcript: [...liveTranscript, { role: 'user', content: response }],
        }),
      }).then(r => r.json()).then((data: { interventionType: string; payload: Record<string, unknown> }) => {
        if (data.interventionType === 'question') {
          setLiveQuestion((data.payload.question as string) ?? '');
        }
      }).catch(console.error).finally(() => setIsLoading(false));
    }
  }, [isDemo, demo, liveNodes, liveEdges, liveTranscript, setLiveNodes]);

  // ── Export ─────────────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const transcript = isDemo
      ? [
          { role: 'assistant', content: AI_QUESTION_1 },
          { role: 'user', content: LUCAS_RESPONSE_1 },
          { role: 'assistant', content: AI_QUESTION_2 },
          { role: 'user', content: LUCAS_RESPONSE_2 },
        ]
      : liveTranscript;
    sessionStorage.setItem('maieutic_export', JSON.stringify({
      nodes,
      edges,
      synthesis: synthesisData,
      transcript,
      isDemo,
    }));
    router.push('/export');
  }, [isDemo, nodes, edges, synthesisData, liveTranscript, router]);

  // ── Unexplored zone button (demo: from showUnexploredButton state) ──────────
  const showUnexploredBtn = isDemo ? demo.showUnexploredButton : false;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d0d0f', position: 'relative', overflow: 'hidden' }}>

      {phase === 'intake' && (
        <IntakeZone
          isDemo={isDemo}
          isTypingPaste={demo.isTypingPaste}
          typedText={demo.typedPasteText}
          showSpinner={demo.showSpinner}
          onSubmit={handleIntakeSubmit}
        />
      )}

      {phase === 'exploration' && (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
          <div style={{
            width: rightPaneOpen ? 'calc(100% - 320px)' : '100%',
            height: '100%',
            transition: 'width 400ms ease',
          }}>
            <TerrainCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={isDemo ? demo.onNodesChange : onLiveNodesChange}
              onEdgesChange={isDemo ? demo.onEdgesChange : onLiveEdgesChange}
              onConnect={!isDemo ? onConnect : undefined}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              bottomOffset={180}
              rightOffset={rightPaneOpen ? 320 : 0}
              pulsedNodeIds={pulsedNodeIds}
            />
          </div>

          {/* Right detail pane */}
          {selectedNode && (
            <NodeDetailPane
              node={selectedNode}
              isDemo={isDemo}
              isAnimating={isDemo ? demo.isAnimating : false}
              onClose={() => setSelectedNodeId(null)}
              onDeleteNode={handleDeleteNode}
              onUpdateLabel={handleUpdateLabel}
              onGhostSubmit={handleGhostSubmit}
            />
          )}

          {/* History panel (left overlay) */}
          {showHistory && (
            <HistoryPanel
              entries={historyLog}
              onClose={() => setShowHistory(false)}
              onHighlightNodes={handleHighlightNodes}
            />
          )}

          {/* Bottom: question + response + notifications */}
          {(currentQuestion || (isDemo && demo.simulatedResponse)) && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: rightPaneOpen ? 320 : 0,
              background: 'linear-gradient(to top, rgba(13,13,15,0.97) 60%, transparent)',
              padding: '3rem 4rem 2.5rem',
              animation: 'fade-in 0.5s ease',
              transition: 'right 400ms ease',
              pointerEvents: 'none',
            }}>
              {/* Notifications */}
              {notifications.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  {notifications.map(n => (
                    <NotificationLine key={n.id} lines={n.lines} born={n.born} />
                  ))}
                </div>
              )}

              {currentQuestion && (
                <p style={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: '1.15rem',
                  lineHeight: 1.85,
                  color: '#e8e8f0',
                  margin: '0 0 1.5rem',
                  maxWidth: 560,
                }}>
                  {currentQuestion}
                </p>
              )}
              {isDemo && demo.simulatedResponse && (
                <p style={{
                  fontFamily: 'system-ui, sans-serif',
                  fontSize: '0.875rem',
                  lineHeight: 1.7,
                  color: 'rgba(232,232,240,0.55)',
                  margin: '0 0 1rem',
                  maxWidth: 520,
                }}>
                  {demo.simulatedResponse}
                  {demo.isTypingResponse && (
                    <span className="cursor-blink" style={{ opacity: 0.4 }}>|</span>
                  )}
                </p>
              )}
              {!isDemo && currentQuestion && (
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 560, pointerEvents: 'auto' }}>
                  <textarea
                    value={liveResponse}
                    onChange={e => setLiveResponse(e.target.value)}
                    disabled={isLoading}
                    placeholder="respond here"
                    rows={3}
                    onKeyDown={e => {
                      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleResponseSubmit();
                      }
                    }}
                    style={{
                      flex: 1,
                      background: 'transparent',
                      border: 'none',
                      borderBottom: '1px solid rgba(232,232,240,0.12)',
                      color: '#e8e8f0',
                      fontFamily: 'system-ui, sans-serif',
                      fontSize: '0.875rem',
                      lineHeight: 1.65,
                      resize: 'none',
                      outline: 'none',
                      caretColor: '#e8e8f0',
                      paddingBottom: '0.5rem',
                    }}
                  />
                  <button
                    onClick={handleResponseSubmit}
                    disabled={isLoading || !liveResponse.trim()}
                    style={{
                      color: liveResponse.trim() && !isLoading ? '#e8e8f0' : 'rgba(232,232,240,0.18)',
                      background: 'none',
                      border: '1px solid',
                      borderColor: liveResponse.trim() && !isLoading ? 'rgba(232,232,240,0.3)' : 'rgba(232,232,240,0.08)',
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      fontFamily: 'system-ui, sans-serif',
                      padding: '6px 14px',
                      cursor: liveResponse.trim() && !isLoading ? 'pointer' : 'not-allowed',
                      flexShrink: 0,
                      marginBottom: 4,
                    }}
                  >
                    {isLoading ? '···' : '⌘↵'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notifications when no question visible */}
          {!(currentQuestion || (isDemo && demo.simulatedResponse)) && notifications.length > 0 && (
            <div style={{
              position: 'absolute',
              bottom: '2.5rem',
              left: '4rem',
              right: rightPaneOpen ? 320 : 0,
              pointerEvents: 'none',
            }}>
              {notifications.map(n => (
                <NotificationLine key={n.id} lines={n.lines} born={n.born} />
              ))}
            </div>
          )}

          {/* Top-left: history button */}
          <button
            onClick={() => setShowHistory(v => !v)}
            style={{ ...TOP_BTN, position: 'absolute', top: 20, left: 20 }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.7)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.3)'; }}
          >
            — history
          </button>

          {/* Top-right: unexplored button */}
          {showUnexploredBtn && (
            <button
              onClick={() => setSelectedNodeId('__unexplored__')}
              style={{ ...TOP_BTN, position: 'absolute', top: 20, right: 20 }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.7)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.3)'; }}
            >
              — unexplored territory
            </button>
          )}

          {/* Bottom-right: persistent finish button */}
          <button
            onClick={isDemo ? demo.finish : handleOpenSynthesis}
            disabled={isLoading}
            style={{
              ...TOP_BTN,
              position: 'absolute',
              bottom: 24,
              right: 24,
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!isLoading) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.7)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.3)'; }}
          >
            — synthesize
          </button>
        </div>
      )}

      {phase === 'synthesis' && synthesisData && (
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          <div style={{ width: '60%', height: '100%' }}>
            <TerrainCanvas
              nodes={nodes}
              edges={edges}
              onNodesChange={isDemo ? demo.onNodesChange : onLiveNodesChange}
              onEdgesChange={isDemo ? demo.onEdgesChange : onLiveEdgesChange}
              onEdgeClick={handleEdgeClick}
              bottomOffset={0}
            />
          </div>
          <div style={{ width: '40%', height: '100%' }}>
            <SynthesisPanel
              data={synthesisData}
              isDemo={isDemo}
              onExport={handleExport}
              stats={{
                questionsAnswered: isDemo
                  ? 2
                  : liveTranscript.filter(e => e.role === 'user').length,
                nodeCount: nodes.length,
                edgeCount: edges.length,
                wordCount: isDemo
                  ? [...LUCAS_RESPONSE_1.trim().split(/\s+/), ...LUCAS_RESPONSE_2.trim().split(/\s+/)].filter(Boolean).length
                  : liveTranscript
                      .filter(e => e.role === 'user')
                      .reduce((sum, e) => sum + e.content.trim().split(/\s+/).filter(Boolean).length, 0),
              }}
            />
          </div>
        </div>
      )}

      {/* Demo mode indicator */}
      {isDemo && (
        <div style={{
          position: 'fixed',
          bottom: 12,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 16px',
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {demo.isReady && (
              <span style={{
                color: 'rgba(232,232,240,0.35)',
                fontSize: 10,
                letterSpacing: '0.15em',
                fontFamily: 'system-ui, sans-serif',
                animation: 'fade-in 0.3s ease',
              }}>
                — press L
              </span>
            )}
            {demo.isAnimating && (
              <span style={{
                color: 'rgba(232,232,240,0.2)',
                fontSize: 10,
                letterSpacing: '0.12em',
                fontFamily: 'system-ui, sans-serif',
                fontStyle: 'italic',
              }}>
                ···
              </span>
            )}
          </div>
          <span style={{
            color: 'rgba(232,232,240,0.15)',
            fontSize: 9,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}>
            demo mode
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Notification component with fade-in / hold / fade-out ───────────────────
function NotificationLine({ lines }: { lines: string[]; born: number }) {
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in
    const t1 = setTimeout(() => setOpacity(1), 10);
    // Fade out
    const t2 = setTimeout(() => setOpacity(0), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div style={{
      opacity,
      transition: opacity === 0 ? 'opacity 400ms ease' : 'opacity 300ms ease',
      marginBottom: 4,
    }}>
      {lines.map((line, i) => (
        <div key={i} style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: 10,
          letterSpacing: '0.12em',
          color: 'rgba(232,232,240,0.4)',
          lineHeight: 1.6,
        }}>
          {line}
        </div>
      ))}
    </div>
  );
}

export default function MaieuticApp({ isDemo }: { isDemo: boolean }) {
  return (
    <ReactFlowProvider>
      <AppInner isDemo={isDemo} />
    </ReactFlowProvider>
  );
}
