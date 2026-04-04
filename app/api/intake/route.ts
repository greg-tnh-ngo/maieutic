import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '../../lib/mode-detector';

const DEMO_RESPONSE = {
  firstPrompt: "What did he leave there that he couldn't carry with him?",
  initialNodes: [
    { id: 'return',  label: 'return', type: 'concept', position: { x: 180, y: 160 } },
    { id: 'guilt',   label: 'guilt',  type: 'tension', position: { x: 340, y: 230 } },
    { id: 'home',    label: 'home',   type: 'concept', position: { x: 130, y: 290 } },
  ],
  initialEdges: [],
};

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json(DEMO_RESPONSE);
  }

  const { text } = await req.json() as { text: string };

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    tools: [
      {
        name: 'intake_analysis',
        description: 'Analyse le texte pour en extraire les absences, tensions et zones non explorées. Génère le premier prompt et les nœuds initiaux.',
        input_schema: {
          type: 'object' as const,
          properties: {
            firstPrompt: {
              type: 'string',
              description: 'A single question that reveals a major absence. Maximum 15 words. End with a question mark.',
            },
            initialNodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:       { type: 'string' },
                  label:    { type: 'string', description: '1-2 words, lowercase' },
                  type:     { type: 'string', enum: ['concept', 'tension', 'ghost', 'absence'] },
                  position: {
                    type: 'object',
                    properties: { x: { type: 'number' }, y: { type: 'number' } },
                    required: ['x', 'y'],
                  },
                },
                required: ['id', 'label', 'type', 'position'],
              },
            },
            initialEdges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  source: { type: 'string' },
                  target: { type: 'string' },
                  type:   { type: 'string', enum: ['solid', 'dotted', 'contradiction'] },
                },
                required: ['source', 'target', 'type'],
              },
            },
          },
          required: ['firstPrompt', 'initialNodes', 'initialEdges'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content: `Analyze this creative text. Identify absences — what is unspoken but present, unformulated tensions, what the author avoids. Generate 3-5 initial nodes for the terrain and a first question that reveals a major absence.\n\nText:\n${text}`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'intake_analysis') {
      return NextResponse.json(block.input);
    }
  }

  return NextResponse.json(DEMO_RESPONSE);
}
