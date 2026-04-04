import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '../../lib/mode-detector';

export interface ExportTemplate {
  id: string;
  label: string;
  description: string;
  content: string;
}

const DEMO_TEMPLATES: ExportTemplate[] = [
  {
    id: 'scene-details',
    label: 'Details about the scene',
    description: 'Everything discussed about the setting — the house, the window, the street',
    content: `# Details About the Scene\n\n## The house\n- Second-floor window, painted blue by the new family\n- The street that has shrunk — or Marco who has grown\n- Another family's life now visible behind the glass\n\n## The car\n- Engine off. Twenty minutes without getting out.\n- The unnamed debt settling into the seat beside him.\n- The gap between what he imagined and what he found.\n\n## The window as central detail\n- Blue — a color that doesn't suit what happened in that room\n- Painted over by people who don't know the weight of it\n- The thing that proves absence has a texture\n\n## Sensory specifics to write toward\n- What shade of blue exactly — chosen or arbitrary?\n- The sound of the street: quieter than he remembers, or louder?\n- What does he do with his hands while he sits there?\n- Does he look at the window or away from it?\n`,
  },
  {
    id: 'questions',
    label: 'Rewriting questions',
    description: 'Six questions the terrain says the first draft is missing',
    content: `# Questions for Rewriting\n\n1. What can't Marco afford to know about himself?\n2. The blue window — who painted it, and why can't he accept it?\n3. What exactly was the promise he made at nineteen?\n4. What would have happened if he'd never come back?\n5. In what sense is this return also another kind of leaving?\n6. Who does the guilt protect — his father, or himself?\n`,
  },
  {
    id: 'character',
    label: 'What Marco protects',
    description: 'Character notes: what he shows vs. what he hides',
    content: `# Character Notes — Marco\n\n## What he shows\nGuilt. A sense of debt. The return as reparation.\n\n## What he protects\nThe relief of having left. The possibility that the distance was necessary to survive.\n\n## The central contradiction\nHe came back to honor a promise to a dead father. But the promise may have been to his teenage self — not to the father at all.\n\n## What he cannot say yet\nThat he's glad he missed it.\n`,
  },
];

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json(DEMO_TEMPLATES);
  }

  const { synthesis, transcript } = await req.json() as {
    synthesis: { resolved: string[]; open: string[]; avoided: string[] };
    transcript: Array<{ role: string; content: string }>;
  };

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  const transcriptText = transcript.map(m => `${m.role}: ${m.content}`).join('\n\n');
  const synthesisText = [
    'Emerged: ' + synthesis.resolved.join(', '),
    'Still open: ' + synthesis.open.join(', '),
    'Avoided: ' + synthesis.avoided.join(', '),
  ].join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    tools: [
      {
        name: 'suggest_export_templates',
        description: 'Suggest 3 export templates based on the conversation.',
        input_schema: {
          type: 'object' as const,
          properties: {
            templates: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  label: { type: 'string', description: 'Short title, 2-4 words' },
                  description: { type: 'string', description: 'One-line description' },
                  content: { type: 'string', description: 'The full export content in markdown' },
                },
                required: ['id', 'label', 'description', 'content'],
              },
              description: 'Exactly 3 export templates',
            },
          },
          required: ['templates'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content: `Based on this creative session, generate 3 immediately useful export documents for the writer. Make them specific and grounded in the actual content discussed.\n\nSynthesis:\n${synthesisText}\n\nTranscript:\n${transcriptText}\n\nProduce: one narrative fragment, one set of rewriting questions, and one character/concept analysis. Write the actual full content for each.`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'suggest_export_templates') {
      const input = block.input as { templates: ExportTemplate[] };
      return NextResponse.json(input.templates);
    }
  }

  return NextResponse.json(DEMO_TEMPLATES);
}
