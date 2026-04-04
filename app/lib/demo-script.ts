import type { Node, Edge } from 'reactflow';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DemoAction =
  | 'show-intake'
  | 'simulate-paste'
  | 'analyze-and-ask'
  | 'show-question'
  | 'simulate-response'
  | 'add-nodes'
  | 'add-edge'
  | 'add-ghost-node'
  | 'animate-node-move'
  | 'pulse-empty-zone'
  | 'enable-synthesis'
  | 'show-synthesis'
  | 'show-export-suggestions';

export interface DemoStep {
  action: DemoAction;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  /** If true, demo waits for L key press. Default: false (auto-fires). */
  requiresUserInput?: boolean;
  /** ms to wait before auto-firing after previous step completes. Default: 800. */
  autoDelay?: number;
}

export interface SynthesisData {
  resolved: string[];
  open: string[];
  avoided: string[];
  exportSuggestions: ExportSuggestion[];
}

export interface ExportSuggestion {
  id: string;
  label: string;
  description: string;
  markdown: string;
}

// ─── Demo text ────────────────────────────────────────────────────────────────

export const LUCAS_TEXT = `Marco came back to his hometown after fifteen years away. He didn't know why he had waited so long — or maybe he knew too well. The house he grew up in belonged to another family now. He sat parked in front of it for twenty minutes without getting out of the car.

The street had shrunk, or he had grown, he wasn't sure anymore. His father had died here, in that room on the second floor whose window was now painted blue. The blue didn't suit him.

Marco owed something to this town, to his father, to the version of himself as a teenager who had promised to come back. He had come back. It didn't feel like he'd imagined. He wasn't sure if this was a return or just another kind of leaving.`;

export const LUCAS_RESPONSE_1 = `The way of being a son, I think. Everything that existed in the relationship with his father — the unresolved arguments, the awkward tenderness, the silences that meant something. He couldn't take that with him. It stayed there, in that house with the blue window.`;

export const LUCAS_RESPONSE_2 = `The guilt comes from leaving before his father died. There were still things to say. But maybe also — and this is harder to admit — he's relieved he left. That the distance let him survive something.`;

export const AI_QUESTION_1 = `What did he leave there that he couldn't carry with him?`;
export const AI_QUESTION_2 = `What did the promise look like — and who was it made to?`;

// ─── Node positions — spread across canvas ───────────────────────────────────

const POS = {
  return_:   { x: 220, y: 200 },
  guilt:     { x: 460, y: 310 },
  home:      { x: 160, y: 400 },
  father:    { x: 340, y: 120 },
  promise:   { x: 560, y: 140 },
  debt:      { x: 330, y: 460 },
  leaving:   { x: 780, y: 260 },
  belonging: { x: 940, y: 370 },
  transit:   { x: 670, y: 430 },
};

// ─── Synthesis ────────────────────────────────────────────────────────────────

const SYNTHESIS: SynthesisData = {
  resolved: [
    'The father-son relationship as an irreducible origin',
    'Guilt as a form of loyalty to what was left behind',
  ],
  open: [
    'The exact nature of the debt — to whom, for what',
    'What "coming back" meant to him at nineteen',
  ],
  avoided: [
    'The relief of having left',
    'The possibility that distance was necessary for survival',
  ],
  exportSuggestions: [
    {
      id: 'fragment',
      label: 'Narrative fragment',
      description: 'Marco parked in front of the house — twenty minutes in the car',
      markdown: `# Narrative Fragment — Marco\n\n## The scene\nMarco parked in front of his childhood home. Twenty minutes. He doesn't get out.\n\n## What's present\n- The second-floor window, painted blue\n- The street that has shrunk (or him who has grown)\n- The unnamed debt\n\n## The open question\nWhat was he waiting to happen?\n`,
    },
    {
      id: 'scene',
      label: 'Scene plan',
      description: 'The cemetery visit — the unwritten scene',
      markdown: `# Scene Plan — The Cemetery\n\n## Scene to write\nMarco at the cemetery. First visit since returning.\n\n## What we don't know yet\n- Does he speak out loud?\n- What can't he bring himself to say?\n- What is relieved in him, and what does he do with that?\n\n## Dramatic tension\nThe promise he made vs. what he actually did.\n`,
    },
    {
      id: 'character',
      label: 'Character notes',
      description: 'What Marco protects without knowing it',
      markdown: `# Character Notes — Marco\n\n## What he shows\nGuilt. A sense of debt. The return as reparation.\n\n## What he protects\nThe relief of having left. The possibility that the distance was necessary.\n\n## The central contradiction\nHe came back to honor a promise to a dead father.\nBut the promise may have been to his teenage self — not to the father.\n`,
    },
    {
      id: 'questions',
      label: 'Rewriting questions',
      description: 'What the first draft is missing',
      markdown: `# Questions for Rewriting\n\n1. What can't Marco afford to know about himself?\n2. The blue window — who painted it, and why can't Marco accept it?\n3. What exactly was the promise he made to himself at nineteen?\n4. What would have happened if he'd never come back?\n5. In what sense is this return also another leaving?\n`,
    },
  ],
};

// ─── Demo script ─────────────────────────────────────────────────────────────
// requiresUserInput: true  → waits for L key
// requiresUserInput: false (default) → fires automatically after autoDelay ms

export const DEMO_SCRIPT: DemoStep[] = [
  // 0 — auto on mount
  { action: 'show-intake', payload: null, requiresUserInput: false, autoDelay: 0 },

  // 1 — L: user submits text
  { action: 'simulate-paste', payload: { text: LUCAS_TEXT }, requiresUserInput: true },

  // 2 — auto: spinner → first AI question
  { action: 'analyze-and-ask', payload: { question: AI_QUESTION_1 }, requiresUserInput: false, autoDelay: 200 },

  // 3 — L: user types first response
  { action: 'simulate-response', payload: { response: LUCAS_RESPONSE_1 }, requiresUserInput: true },

  // 4 — auto: first three nodes appear
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        {
          id: 'return', label: 'return', type: 'concept', position: POS.return_,
          data: {
            reason: 'The physical act of return as moral obligation — Marco cannot separate the journey from its weight.',
            originQuestion: AI_QUESTION_1,
            originResponse: LUCAS_RESPONSE_1,
          },
        },
        {
          id: 'guilt', label: 'guilt', type: 'tension', position: POS.guilt,
          data: {
            reason: 'Named three times without being examined. Something is being protected here.',
            originQuestion: AI_QUESTION_1,
            originResponse: LUCAS_RESPONSE_1,
          },
        },
        {
          id: 'home', label: 'home', type: 'concept', position: POS.home,
          data: {
            reason: "The house belongs to someone else now. Marco's \"home\" is a place that no longer exists.",
            originQuestion: AI_QUESTION_1,
            originResponse: LUCAS_RESPONSE_1,
          },
        },
      ],
    },
    requiresUserInput: false,
    autoDelay: 700,
  },

  // 5 — auto: second AI question
  { action: 'show-question', payload: { question: AI_QUESTION_2 }, requiresUserInput: false, autoDelay: 1400 },

  // 6 — L: user types second response
  { action: 'simulate-response', payload: { response: LUCAS_RESPONSE_2 }, requiresUserInput: true },

  // 7 — auto: second wave of nodes
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        {
          id: 'father', label: 'father', type: 'concept', position: POS.father,
          data: {
            reason: 'Absent but structuring everything. The dead father is the true addressee of the return.',
            originQuestion: AI_QUESTION_2,
            originResponse: LUCAS_RESPONSE_2,
          },
        },
        { id: 'promise', label: 'promise', type: 'tension', position: POS.promise },
        { id: 'leaving', label: 'leaving', type: 'concept', position: POS.leaving },
      ],
    },
    requiresUserInput: false,
    autoDelay: 700,
  },

  // 8 — auto: guilt → father edge
  { action: 'add-edge', payload: { source: 'guilt', target: 'father', type: 'solid' }, requiresUserInput: false, autoDelay: 900 },

  // 9 — auto: return ↔ leaving contradiction
  { action: 'add-edge', payload: { source: 'return', target: 'leaving', type: 'contradiction' }, requiresUserInput: false, autoDelay: 700 },

  // 10–13 — auto: edges connecting home and promise (all nodes now exist)
  { action: 'add-edge', payload: { source: 'home', target: 'return', type: 'dotted' }, requiresUserInput: false, autoDelay: 700 },
  { action: 'add-edge', payload: { source: 'home', target: 'guilt', type: 'dotted' }, requiresUserInput: false, autoDelay: 600 },
  { action: 'add-edge', payload: { source: 'promise', target: 'father', type: 'dotted' }, requiresUserInput: false, autoDelay: 600 },
  { action: 'add-edge', payload: { source: 'promise', target: 'return', type: 'contradiction' }, requiresUserInput: false, autoDelay: 700 },

  // 14 — auto: ghost node "debt"
  {
    action: 'add-ghost-node',
    payload: {
      id: 'debt',
      label: 'debt',
      position: POS.debt,
      note: 'This word appeared three times without being defined. Owed to whom exactly?',
    },
    requiresUserInput: false,
    autoDelay: 1100,
  },

  // debt edges — debt ghost now exists
  { action: 'add-edge', payload: { source: 'debt', target: 'guilt', type: 'solid' }, requiresUserInput: false, autoDelay: 800 },
  { action: 'add-edge', payload: { source: 'debt', target: 'home', type: 'dotted' }, requiresUserInput: false, autoDelay: 600 },

  // auto: guilt node moves
  {
    action: 'animate-node-move',
    payload: {
      nodeId: 'guilt',
      from: POS.guilt,
      to: { x: POS.guilt.x + 80, y: POS.guilt.y - 60 },
    },
    requiresUserInput: false,
    autoDelay: 1200,
  },

  // 12 — auto: second cluster — belonging
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        { id: 'belonging', label: 'belonging', type: 'concept', position: POS.belonging },
      ],
    },
    requiresUserInput: false,
    autoDelay: 1000,
  },

  // 13 — auto: leaving → belonging dotted
  { action: 'add-edge', payload: { source: 'leaving', target: 'belonging', type: 'dotted' }, requiresUserInput: false, autoDelay: 800 },

  // 14 — auto: empty zone pulses → button appears
  {
    action: 'pulse-empty-zone',
    payload: { position: { x: 660, y: 320 }, label: 'unexplored zone' },
    requiresUserInput: false,
    autoDelay: 1400,
  },

  // 15 — auto: ghost node "transit"
  {
    action: 'add-ghost-node',
    payload: {
      id: 'transit',
      label: 'transit',
      position: POS.transit,
      note: 'Between the two clusters — neither here nor there. The state between leaving and returning.',
    },
    requiresUserInput: false,
    autoDelay: 1200,
  },

  // transit edges — transit ghost now exists
  { action: 'add-edge', payload: { source: 'transit', target: 'leaving', type: 'dotted' }, requiresUserInput: false, autoDelay: 900 },
  { action: 'add-edge', payload: { source: 'transit', target: 'return', type: 'dotted' }, requiresUserInput: false, autoDelay: 600 },

  // auto: synthesis becomes active
  { action: 'enable-synthesis', payload: null, requiresUserInput: false, autoDelay: 1400 },

  // 17 — auto: synthesis panel opens
  { action: 'show-synthesis', payload: SYNTHESIS, requiresUserInput: false, autoDelay: 2200 },
];

export function buildInitialTerrain(): { nodes: Node[]; edges: Edge[] } {
  return { nodes: [], edges: [] };
}
