import type { Node, Edge } from 'reactflow';

// ─── Types ───────────────────────────────────────────────────────────────────

export type DemoAction =
  | 'show-intake'
  | 'simulate-paste'
  | 'analyze-and-ask'   // spinner 1.5s → question (self-advancing)
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
  debt:      { x: 330, y: 460 }, // ghost — between guilt & home
  leaving:   { x: 780, y: 260 },
  belonging: { x: 940, y: 370 },
  transit:   { x: 670, y: 430 }, // ghost — in empty zone
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

// ─── Demo script — each step triggered by L key ──────────────────────────────
// Step 0 auto-executes on mount. Steps 1+ require pressing L.

export const DEMO_SCRIPT: DemoStep[] = [
  // 0 — auto on mount
  { action: 'show-intake', payload: null },

  // 1 — L: types Lucas's text
  { action: 'simulate-paste', payload: { text: LUCAS_TEXT } },

  // 2 — L: spinner 1.5s → first AI question appears
  { action: 'analyze-and-ask', payload: { question: AI_QUESTION_1 } },

  // 3 — L: types Lucas's first response
  { action: 'simulate-response', payload: { response: LUCAS_RESPONSE_1 } },

  // 4 — L: first three nodes appear
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        { id: 'return', label: 'return', type: 'concept', position: POS.return_ },
        { id: 'guilt',  label: 'guilt',  type: 'tension', position: POS.guilt },
        { id: 'home',   label: 'home',   type: 'concept', position: POS.home },
      ],
    },
  },

  // 5 — L: second AI question
  { action: 'show-question', payload: { question: AI_QUESTION_2 } },

  // 6 — L: types Lucas's second response
  { action: 'simulate-response', payload: { response: LUCAS_RESPONSE_2 } },

  // 7 — L: second wave of nodes
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        { id: 'father',  label: 'father',  type: 'concept', position: POS.father },
        { id: 'promise', label: 'promise', type: 'tension', position: POS.promise },
        { id: 'leaving', label: 'leaving', type: 'concept', position: POS.leaving },
      ],
    },
  },

  // 8 — L: guilt → father edge
  { action: 'add-edge', payload: { source: 'guilt', target: 'father', type: 'solid' } },

  // 9 — L: return ↔ leaving contradiction
  { action: 'add-edge', payload: { source: 'return', target: 'leaving', type: 'contradiction' } },

  // 10 — L: ghost node "debt" appears
  {
    action: 'add-ghost-node',
    payload: {
      id: 'debt',
      label: 'debt',
      position: POS.debt,
      note: 'This word appeared three times without being defined. Owed to whom exactly?',
    },
  },

  // 11 — L: guilt node moves (user simulated)
  {
    action: 'animate-node-move',
    payload: {
      nodeId: 'guilt',
      from: POS.guilt,
      to: { x: POS.guilt.x + 80, y: POS.guilt.y - 60 },
    },
  },

  // 12 — L: second cluster — belonging
  {
    action: 'add-nodes',
    payload: {
      nodes: [
        { id: 'belonging', label: 'belonging', type: 'concept', position: POS.belonging },
      ],
    },
  },

  // 13 — L: leaving → belonging dotted
  { action: 'add-edge', payload: { source: 'leaving', target: 'belonging', type: 'dotted' } },

  // 14 — L: empty zone pulses
  {
    action: 'pulse-empty-zone',
    payload: { position: { x: 660, y: 320 }, label: 'unexplored zone' },
  },

  // 15 — L: ghost node "transit" in empty zone
  {
    action: 'add-ghost-node',
    payload: {
      id: 'transit',
      label: 'transit',
      position: POS.transit,
      note: 'Between the two clusters — neither here nor there. The state between leaving and returning.',
    },
  },

  // 16 — L: synthesis button becomes active
  { action: 'enable-synthesis', payload: null },

  // 17 — L: synthesis panel opens
  { action: 'show-synthesis', payload: SYNTHESIS },
];

export function buildInitialTerrain(): { nodes: Node[]; edges: Edge[] } {
  return { nodes: [], edges: [] };
}
