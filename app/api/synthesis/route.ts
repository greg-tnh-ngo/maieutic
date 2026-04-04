import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '../../lib/mode-detector';

const DEMO_SYNTHESIS = {
  resolved: [
    "La relation père-fils comme lieu d'origine irréductible",
    'La culpabilité comme forme de loyauté envers ce qui est resté',
  ],
  open: [
    'La nature exacte de la dette — envers qui, pour quoi',
    'Ce que "revenir" signifiait pour lui à dix-neuf ans',
  ],
  avoided: [
    "Le soulagement d'être parti",
    'La possibilité que la distance ait été nécessaire à la survie',
  ],
  exportSuggestions: [
    {
      id: 'fragment',
      label: 'Fragment narratif',
      description: 'Scène de Marco devant la maison — vingt minutes dans la voiture',
      markdown: '# Fragment narratif — Marco\n\nMarco garé devant la maison. Vingt minutes. Il ne sort pas.\n\n**Ce qui est là**\n- La fenêtre du deuxième étage, peinte en bleu\n- La rue qui a rétréci\n- La dette non nommée\n',
    },
    {
      id: 'scene',
      label: 'Plan de scène',
      description: 'La visite au cimetière — scène non écrite',
      markdown: '# Plan de scène — Le cimetière\n\nMarco au cimetière. Première visite depuis le retour.\n\n**Ce qu\'on ne sait pas encore**\n- Est-ce qu\'il parle à voix haute ?\n- Qu\'est-ce qu\'il n\'arrive pas à dire ?\n',
    },
    {
      id: 'character',
      label: 'Notes de personnage',
      description: 'Ce que Marco protège sans le savoir',
      markdown: '# Notes de personnage — Marco\n\n**Ce qu\'il montre**: Culpabilité. Sentiment de dette.\n\n**Ce qu\'il protège**: Le soulagement d\'être parti.\n\n**La contradiction centrale**: Il est revenu pour honorer une promesse à un père mort. Mais la promesse était peut-être à lui-même adolescent.\n',
    },
    {
      id: 'questions',
      label: 'Questions pour la réécriture',
      description: 'Ce qui manque au premier jet',
      markdown: '# Questions pour la réécriture\n\n1. Qu\'est-ce que Marco ne peut pas se permettre de savoir sur lui-même ?\n2. La fenêtre bleue — qui l\'a peinte ?\n3. À quoi ressemblait la promesse exacte qu\'il s\'était faite ?\n4. Qu\'est-ce qui se serait passé s\'il n\'était jamais revenu ?\n',
    },
  ],
};

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json(DEMO_SYNTHESIS);
  }

  const { nodes, edges, transcript } = await req.json() as {
    nodes: unknown[];
    edges: unknown[];
    transcript: Array<{ role: string; content: string }>;
  };

  const Anthropic = (await import('@anthropic-ai/sdk')).default;
  const client = new Anthropic();

  const nodeLabels = (nodes as Array<{ data?: { label?: string; nodeKind?: string } }>)
    .map(n => `${n.data?.label ?? '?'} (${n.data?.nodeKind ?? '?'})`)
    .join(', ');
  const transcriptText = transcript.map(m => `${m.role}: ${m.content}`).join('\n\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    tools: [
      {
        name: 'synthesize_terrain',
        description: 'Read the full terrain and produce a structured synthesis.',
        input_schema: {
          type: 'object' as const,
          properties: {
            resolved: {
              type: 'array',
              items: { type: 'string' },
              description: 'What clearly emerged — 1-3 items',
            },
            open: {
              type: 'array',
              items: { type: 'string' },
              description: 'What remains open and unresolved — 1-3 items',
            },
            avoided: {
              type: 'array',
              items: { type: 'string' },
              description: 'What was avoided or sidestepped — 1-2 items',
            },
            exportSuggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id:          { type: 'string' },
                  label:       { type: 'string' },
                  description: { type: 'string' },
                  markdown:    { type: 'string', description: 'Markdown content of the export' },
                },
                required: ['id', 'label', 'description', 'markdown'],
              },
              description: '2-4 export format suggestions',
            },
          },
          required: ['resolved', 'open', 'avoided', 'exportSuggestions'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content: `Read this creative terrain and produce a synthesis.\n\nNodes: ${nodeLabels}\n\nTranscript:\n${transcriptText}\n\nIdentify what emerged, what remains open, what was avoided. Suggest export formats useful to the writer.`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'synthesize_terrain') {
      return NextResponse.json(block.input);
    }
  }

  return NextResponse.json(DEMO_SYNTHESIS);
}
