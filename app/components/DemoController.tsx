'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';
import { DEMO_SCRIPT, SYNTHESIS, SynthesisData, DemoAction } from '../lib/demo-script';

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
  showUnexploredButton: boolean;
  unexploredZoneLabel: string;
}

interface TypeResult {
  cancel: () => void;
  complete: () => void;
}

function typeText(
  text: string,
  onUpdate: (partial: string) => void,
  onDone: () => void,
  msPerChar = 22
): TypeResult {
  let i = 0;
  let finished = false;
  const id = setInterval(() => {
    i++;
    onUpdate(text.slice(0, i));
    if (i >= text.length) {
      clearInterval(id);
      if (!finished) { finished = true; onDone(); }
    }
  }, msPerChar);
  return {
    cancel: () => clearInterval(id),
    complete: () => {
      clearInterval(id);
      if (!finished) { finished = true; onUpdate(text); onDone(); }
    },
  };
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
    data: { edgeKind: kind, createdAt: Date.now() },
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
  const stepIndexRef = useRef(-1);
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
    showUnexploredButton: false,
    unexploredZoneLabel: '',
  });

  // Keep ref in sync for use in callbacks without stale closures
  useEffect(() => { stepIndexRef.current = stepIndex; }, [stepIndex]);

  const cleanups = useRef<Array<() => void>>([]);
  const completes = useRef<Array<() => void>>([]);

  const dispatch = useCallback((action: DemoAction, payload: unknown) => {
    cleanups.current.forEach(fn => fn());
    cleanups.current = [];
    completes.current = [];

    const p = (payload ?? {}) as Record<string, unknown>;

    switch (action) {
      case 'show-intake':
        setState(prev => ({ ...prev, phase: 'intake' }));
        break;

      case 'simulate-paste': {
        setIsAnimating(true);
        setState(prev => ({ ...prev, isTypingPaste: true, typedPasteText: '' }));
        const { cancel, complete } = typeText(
          p.text as string,
          text => setState(prev => ({ ...prev, typedPasteText: text })),
          () => { setState(prev => ({ ...prev, isTypingPaste: false })); setIsAnimating(false); },
          16
        );
        cleanups.current.push(cancel);
        completes.current.push(complete);
        break;
      }

      case 'analyze-and-ask': {
        setIsAnimating(true);
        setState(prev => ({ ...prev, showSpinner: true, phase: 'exploration' }));
        const completeAnalyze = () => {
          setState(prev => ({
            ...prev,
            showSpinner: false,
            currentQuestion: p.question as string,
            simulatedResponse: '',
            isTypingResponse: false,
          }));
          setIsAnimating(false);
        };
        const tid = setTimeout(completeAnalyze, 1500);
        cleanups.current.push(() => clearTimeout(tid));
        completes.current.push(() => { clearTimeout(tid); completeAnalyze(); });
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
        const { cancel, complete } = typeText(
          p.response as string,
          text => setState(prev => ({ ...prev, simulatedResponse: text })),
          () => { setState(prev => ({ ...prev, isTypingResponse: false })); setIsAnimating(false); },
          26
        );
        cleanups.current.push(cancel);
        completes.current.push(complete);
        break;
      }

      case 'add-nodes': {
        const incoming = (p.nodes as Array<{
          id: string;
          label: string;
          type: string;
          position: { x: number; y: number };
          data?: Record<string, unknown>;
        }>);
        const now = Date.now();
        setNodes(prev => {
          const existingIds = new Set(prev.map(n => n.id));
          const newNodes: Node[] = incoming
            .filter(n => !existingIds.has(n.id))
            .map(n => ({
              id: n.id,
              type: n.type,
              position: n.position,
              data: { label: n.label, createdAt: now, ...(n.data ?? {}) },
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
        const now = Date.now();
        const ghost: Node = {
          id: p.id as string,
          type: 'ghost',
          position: p.position as { x: number; y: number },
          data: { label: p.label, note: p.note, createdAt: now },
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
        let rafId: number;
        let completed = false;

        const step = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          const ease = 1 - Math.pow(1 - t, 3);
          setNodes(prev =>
            prev.map(n =>
              n.id === nodeId
                ? { ...n, position: { x: from.x + (to.x - from.x) * ease, y: from.y + (to.y - from.y) * ease } }
                : n
            )
          );
          if (t < 1) { rafId = requestAnimationFrame(step); }
          else if (!completed) { completed = true; setIsAnimating(false); }
        };
        rafId = requestAnimationFrame(step);
        cleanups.current.push(() => cancelAnimationFrame(rafId));
        completes.current.push(() => {
          cancelAnimationFrame(rafId);
          if (!completed) {
            completed = true;
            setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, position: to } : n));
            setIsAnimating(false);
          }
        });
        break;
      }

      case 'pulse-empty-zone': {
        setState(prev => ({
          ...prev,
          showUnexploredButton: true,
          unexploredZoneLabel: p.label as string,
        }));
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

  // Dispatch current step when stepIndex changes
  useEffect(() => {
    if (stepIndex < 0 || stepIndex >= DEMO_SCRIPT.length) return;
    const step = DEMO_SCRIPT[stepIndex];
    dispatch(step.action, step.payload);
  }, [stepIndex, dispatch]);

  // Auto-advance non-user-input steps
  useEffect(() => {
    if (!enabled || stepIndex < 0) return;
    if (isAnimating) return; // wait for current animation to complete
    const nextIndex = stepIndex + 1;
    if (nextIndex >= DEMO_SCRIPT.length) return;
    const nextStep = DEMO_SCRIPT[nextIndex];
    if (nextStep.requiresUserInput) return; // wait for L key
    const delay = nextStep.autoDelay ?? 800;
    const tid = setTimeout(() => {
      setStepIndex(nextIndex);
    }, delay);
    return () => clearTimeout(tid);
  }, [isAnimating, stepIndex, enabled]);

  // Start demo on mount
  useEffect(() => {
    if (enabled) setStepIndex(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const advance = useCallback(() => {
    if (!enabled) return;
    // If animating: complete animation immediately (skip to end)
    if (isAnimating) {
      completes.current.forEach(fn => fn());
      completes.current = [];
      cleanups.current.forEach(fn => fn());
      cleanups.current = [];
      return;
    }
    // Only manually advance when next step requires user input
    // (non-user steps are handled by auto-advance above)
    const nextIdx = stepIndexRef.current + 1;
    if (nextIdx >= DEMO_SCRIPT.length) return;
    if (!DEMO_SCRIPT[nextIdx].requiresUserInput) return;
    setStepIndex(nextIdx);
  }, [isAnimating, enabled]);

  // isReady: true when waiting for user L press (next step requiresUserInput)
  const nextIndex = stepIndex + 1;
  const nextStep = nextIndex < DEMO_SCRIPT.length ? DEMO_SCRIPT[nextIndex] : null;
  const isReady = !isAnimating && nextStep?.requiresUserInput === true;

  // finish: triggers show-synthesis with the pre-written synthesis data
  const finish = useCallback(() => {
    if (!enabled) return;
    dispatch('show-synthesis', SYNTHESIS);
  }, [enabled, dispatch]);

  return {
    ...state,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    advance,
    finish,
    isAnimating,
    isReady,
    stepIndex,
    totalSteps: DEMO_SCRIPT.length,
  };
}
