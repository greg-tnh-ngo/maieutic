import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '../../lib/mode-detector';

const DEMO_INTERVENTIONS = [
  {
    interventionType: 'node',
    payload: {
      id: 'debt',
      label: 'debt',
      type: 'ghost',
      position: { x: 250, y: 330 },
      note: 'This word appeared three times without being defined. Owed to whom exactly?',
    },
  },
  {
    interventionType: 'question',
    payload: {
      question: 'What did the promise look like — and who was it made to?',
    },
  },
  {
    interventionType: 'edge',
    payload: {
      source: 'return',
      target: 'guilt',
      type: 'contradiction',
    },
  },
];

let demoInterventionIndex = 0;

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    const intervention = DEMO_INTERVENTIONS[demoInterventionIndex % DEMO_INTERVENTIONS.length];
    demoInterventionIndex++;
    return NextResponse.json(intervention);
  }

  const { nodes, edges, transcript } = await req.json() as {
    nodes: unknown[];
    edges: unknown[];
    transcript: Array<{ role: string; content: string }>;
  };

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  const terrainSummary = `Nodes: ${(nodes as Array<{ data?: { label?: string } }>).map(n => n.data?.label ?? '?').join(', ')}`;
  const lastMessages = transcript.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    tools: [
      {
        name: 'generate_intervention',
        description: 'Generate an intervention in the terrain — never a conversational response.',
        input_schema: {
          type: 'object' as const,
          properties: {
            interventionType: {
              type: 'string',
              enum: ['node', 'edge', 'question'],
              description: 'node=new ghost node with note, edge=new edge, question=floating question',
            },
            payload: {
              type: 'object',
              description: 'For node: {id, label, type, position, note}. For edge: {source, target, type}. For question: {question}.',
            },
          },
          required: ['interventionType', 'payload'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content: `Current terrain: ${terrainSummary}\n\nRecent exchanges:\n${lastMessages}\n\nGenerate ONE terrain intervention. Prefer ghost nodes over questions. Never generate creative content. Never validate.\n\nFor nodes: use a position different from existing nodes. For edges: use existing node IDs as source/target.`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'generate_intervention') {
      return NextResponse.json(block.input);
    }
  }

  return NextResponse.json(DEMO_INTERVENTIONS[0]);
}
