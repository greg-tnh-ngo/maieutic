'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Node, Edge, useNodesState, useEdgesState, OnConnect, addEdge, ReactFlowProvider } from 'reactflow';
import { useDemoController } from './DemoController';
import TerrainCanvas from './TerrainCanvas';
import IntakeZone from './IntakeZone';
import SynthesisPanel from './SynthesisPanel';
import { SynthesisData } from '../lib/demo-script';
import { spreadNodes, findFreePosition } from '../lib/terrain-utils';

type Phase = 'intake' | 'exploration' | 'synthesis';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
}

function AppInner({ isDemo }: { isDemo: boolean }) {
  const demo = useDemoController(isDemo);

  useEffect(() => {
    if (!isDemo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l') demo.advance();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDemo, demo.advance]);

  const [livePhase, setLivePhase] = useState<Phase>('intake');
  const [liveNodes, setLiveNodes, onLiveNodesChange] = useNodesState([]);
  const [liveEdges, setLiveEdges, onLiveEdgesChange] = useEdgesState([]);
  const [liveQuestion, setLiveQuestion] = useState<string | null>(null);
  const [liveResponse, setLiveResponse] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<TranscriptEntry[]>([]);
  const [interventionCount, setInterventionCount] = useState(0);
  const [liveSynthesis, setLiveSynthesis] = useState<SynthesisData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const nodeCountRef = useRef(0);

  const phase: Phase = isDemo ? demo.phase : livePhase;
  const nodes: Node[] = isDemo ? demo.nodes : liveNodes;
  const edges: Edge[] = isDemo ? demo.edges : liveEdges;
  const currentQuestion = isDemo ? demo.currentQuestion : liveQuestion;
  const synthesisData = isDemo ? demo.synthesisData : liveSynthesis;
  const synthesisEnabled = isDemo ? demo.synthesisEnabled : interventionCount >= 3;

  // ── Live: intake submit ──
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
      const rawNodes = data.initialNodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: { label: n.label },
      }));
      const rfNodes = spreadNodes(rawNodes);
      nodeCountRef.current = rfNodes.length;
      setLiveNodes(rfNodes);
      const rfEdges = data.initialEdges.map(e => ({
        id: `${e.source}--${e.target}`,
        source: e.source,
        target: e.target,
        data: { edgeKind: e.type },
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
  }, [setLiveNodes, setLiveEdges]);

  // ── Live: response submit ──
  const handleResponseSubmit = useCallback(async () => {
    if (!liveResponse.trim() || isLoading) return;
    const text = liveResponse.trim();
    setLiveResponse('');
    setLiveQuestion(null);
    setIsLoading(true);
    const newTranscript: TranscriptEntry[] = [
      ...liveTranscript,
      { role: 'user', content: text },
    ];
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
      if (intervention.interventionType === 'node') {
        const p = intervention.payload;
        setLiveNodes(prev => {
          const hint = p.position as { x: number; y: number } | undefined;
          const pos = findFreePosition(prev, hint ?? { x: 300 + prev.length * 30, y: 250 });
          const newNode: Node = {
            id: p.id as string,
            type: (p.type as string) ?? 'ghost',
            position: pos,
            data: { label: p.label, note: p.note },
          };
          return [...prev, newNode];
        });
      } else if (intervention.interventionType === 'edge') {
        const p = intervention.payload;
        const edgeType = p.type as string;
        const newEdge: Edge = {
          id: `${p.source}--${p.target}`,
          source: p.source as string,
          target: p.target as string,
          data: { edgeKind: edgeType },
          style: {
            stroke: edgeType === 'contradiction' ? '#8b2020' : 'rgba(232,232,240,0.25)',
            strokeWidth: 1,
            strokeDasharray: edgeType === 'dotted' ? '5 5' : undefined,
          },
          animated: false,
        };
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
  }, [liveResponse, isLoading, liveTranscript, liveNodes, liveEdges, setLiveNodes, setLiveEdges]);

  // ── Live: connect nodes manually ──
  const onConnect: OnConnect = useCallback(
    connection => setLiveEdges(prev => addEdge({
      ...connection,
      data: { edgeKind: 'solid' },
      style: { stroke: 'rgba(232,232,240,0.25)', strokeWidth: 1 },
      animated: false,
    }, prev)),
    [setLiveEdges]
  );

  // ── Synthesis ──
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
          <TerrainCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={isDemo ? demo.onNodesChange : onLiveNodesChange}
            onEdgesChange={isDemo ? demo.onEdgesChange : onLiveEdgesChange}
            onConnect={!isDemo ? onConnect : undefined}
          />

          {(currentQuestion || (isDemo && demo.simulatedResponse)) && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'linear-gradient(to top, rgba(13,13,15,0.97) 60%, transparent)',
              padding: '3rem 4rem 2.5rem',
              animation: 'fade-in 0.5s ease',
            }}>
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
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 560 }}>
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

          {synthesisEnabled && (
            <button
              onClick={handleOpenSynthesis}
              disabled={isDemo || isLoading}
              style={{
                position: 'absolute',
                top: 20,
                right: 20,
                color: 'rgba(232,232,240,0.3)',
                background: 'none',
                border: '1px solid rgba(232,232,240,0.1)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
                padding: '6px 14px',
                cursor: isDemo ? 'default' : 'pointer',
                transition: 'all 0.2s',
                animation: 'fade-in 0.4s ease',
              }}
              onMouseEnter={e => {
                if (!isDemo) (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.7)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.color = 'rgba(232,232,240,0.3)';
              }}
            >
              synthesis
            </button>
          )}
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
            />
          </div>
          <div style={{ width: '40%', height: '100%' }}>
            <SynthesisPanel data={synthesisData} isDemo={isDemo} />
          </div>
        </div>
      )}

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
            {!demo.isReady && demo.stepIndex > 0 && (
              <span style={{
                color: 'rgba(232,232,240,0.15)',
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

export default function MaieuticApp({ isDemo }: { isDemo: boolean }) {
  return (
    <ReactFlowProvider>
      <AppInner isDemo={isDemo} />
    </ReactFlowProvider>
  );
}