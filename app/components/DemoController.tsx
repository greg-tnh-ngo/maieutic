'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import { DEMO_SCRIPT, SynthesisData, DemoAction } from '../lib/demo-script';

export type DemoPhase = 'intake' | 'exploration' | 'synthesis';

interface DemoState {
  phase: DemoPhase;
  currentQuestion: string | null;
  simulatedResponse: string;
  isTypingResponse: boolean;
  isTypingPaste: boolean;
  typedPasteText: string;
  showSpinner: boolean;
  synthesisData: SynthesisData | null;
  synthesisEnabled: boolean;
}

function typeText(
  text: string,
  onUpdate: (partial: string) => void,
  onDone: () => void,
  msPerChar = 22
): () => void {
  let i = 0;
  const id = setInterval(() => {
    i++;
    onUpdate(text.slice(0, i));
    if (i >= text.length) {
      clearInterval(id);
      onDone();
    }
  }, msPerChar);
  return () => clearInterval(id);
}

function makeEdge(
  source: string,
  target: string,
  kind: 'solid' | 'dotted' | 'contradiction'
): Edge {
  return {
    id: `${source}--${target}`,
    source,
    target,
    type: 'straight',
    data: { edgeKind: kind },
    style: {
      stroke: kind === 'contradiction' ? '#8b2020' : 'rgba(232,232,240,0.3)',
      strokeWidth: 1,
      strokeDasharray: kind === 'dotted' ? '4 4' : undefined,
    },
    animated: false,
  };
}

export function useDemoController(enabled: boolean) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const [stepIndex, setStepIndex] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [state, setState] = useState<DemoState>({
    phase: 'intake',
    currentQuestion: null,
    simulatedResponse: '',
    isTypingResponse: false,
    isTypingPaste: false,
    typedPasteText: '',
    showSpinner: false,
    synthesisData: null,
    synthesisEnabled: false,
  });

  const cleanups = useRef<Array<() => void>>([]);

  const dispatch = useCallback((action: DemoAction, payload: unknown) => {
    cleanups.current.forEach(fn => fn());
    cleanups.current = [];

    const p = (payload ?? {}) as Record<string, unknown>;

    switch (action) {
      case 'show-intake':
        setState(prev => ({ ...prev, phase: 'intake' }));
        break;

      case 'simulate-paste': {
        setIsAnimating(true);
        setState(prev => ({ ...prev, isTypingPaste: true, typedPasteText: '' }));
        const cancel = typeText(
          p.text as string,
          text => setState(prev => ({ ...prev, typedPasteText: text })),
          () => { setState(prev => ({ ...prev, isTypingPaste: false })); setIsAnimating(false); },
          16
        );
        cleanups.current.push(cancel);
        break;
      }

      case 'analyze-and-ask': {
        setIsAnimating(true);
        setState(prev => ({ ...prev, showSpinner: true, phase: 'exploration' }));
        const tid = setTimeout(() => {
          setState(prev => ({
            ...prev,
            showSpinner: false,
            currentQuestion: p.question as string,
            simulatedResponse: '',
            isTypingResponse: false,
          }));
          setIsAnimating(false);
        }, 1500);
        cleanups.current.push(() => clearTimeout(tid));
        break;
      }

      case 'show-question':
        setState(prev => ({
          ...prev,
          showSpinner: false,
          currentQuestion: p.question as string,
          simulatedResponse: '',
          isTypingResponse: false,
        }));
        break;

      case 'simulate-response': {
        setIsAnimating(true);
        setState(prev => ({ ...prev, isTypingResponse: true, simulatedResponse: '' }));
        const cancel = typeText(
          p.response as string,
          text => setState(prev => ({ ...prev, simulatedResponse: text })),
          () => { setState(prev => ({ ...prev, isTypingResponse: false })); setIsAnimating(false); },
          26
        );
        cleanups.current.push(cancel);
        break;
      }

      case 'add-nodes': {
        const incoming = (p.nodes as Array<{
          id: string;
          label: string;
          type: string;
          position: { x: number; y: number };
        }>);
        setNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNodes: Node[] = incoming
            .filter(n => !existingIds.has(n.id))
            .map(n => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: { label: n.label },
            }));
          return [...prev, ...newNodes];
        });
        break;
      }

      case 'add-edge': {
        const edge = makeEdge(
          p.source as string,
          p.target as string,
          p.type as 'solid' | 'dotted' | 'contradiction'
        );
        setEdges(prev =>
          prev.find(e => e.id === edge.id) ? prev : [...prev, edge]
        );
        break;
      }

      case 'add-ghost-node': {
        const ghost: Node = {
          id: p.id as string,
          type: 'ghost',
          position: p.position as { x: number; y: number },
          data: { label: p.label, note: p.note },
        };
        setNodes(prev =>
          prev.find(n => n.id === ghost.id) ? prev : [...prev, ghost]
        );
        break;
      }

      case 'animate-node-move': {
        setIsAnimating(true);
        const from = p.from as { x: number; y: number };
        const to = p.to as { x: number; y: number };
        const nodeId = p.nodeId as string;
        const start = performance.now();
        const duration = 800;
        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setNodes(prev =>
            prev.map(n =>
              n.id === nodeId
                ? {
                    ...n,
                    position: {
                      x: from.x + (to.x - from.x) * ease,
                      y: from.y + (to.y - from.y) * ease,
                    },
                  }
                : n
            )
          );
          if (t < 1) requestAnimationFrame(step);
          else setIsAnimating(false);
        };
        requestAnimationFrame(step);
        break;
      }

      case 'pulse-empty-zone': {
        const absence: Node = {
          id: 'absence-zone',
          type: 'absence',
          position: p.position as { x: number; y: number },
          data: { label: p.label as string },
        };
        setNodes(prev =>
          prev.find(n => n.id === 'absence-zone') ? prev : [...prev, absence]
        );
        break;
      }

      case 'enable-synthesis':
        setState(prev => ({ ...prev, synthesisEnabled: true }));
        break;

      case 'show-synthesis':
        setState(prev => ({
          ...prev,
          phase: 'synthesis',
          synthesisData: p as unknown as SynthesisData,
        }));
        break;
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= DEMO_SCRIPT.length) return;
    const step = DEMO_SCRIPT[stepIndex];
    dispatch(step.action, step.payload);
  }, [stepIndex, dispatch]);

  useEffect(() => {
    if (enabled) setStepIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = useCallback(() => {
    if (isAnimating || !enabled) return;
    setStepIndex(prev => {
      if (prev >= DEMO_SCRIPT.length - 1) return prev;
      return prev + 1;
    });
  }, [isAnimating, enabled]);

  return {
    ...state,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    advance,
    isReady: !isAnimating && stepIndex < DEMO_SCRIPT.length - 1,
    stepIndex,
    totalSteps: DEMO_SCRIPT.length,
  };
}