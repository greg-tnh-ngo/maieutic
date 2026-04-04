import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const client = new Anthropic();

// ─── Types ────────────────────────────────────────────────────────────────────

type CreativeState = 'generative' | 'blocked' | 'exhausted';
type QuestionType = 'excavation' | 'pressure' | 'collision' | 'reflection';

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface TerrainNode {
  label: string;
  type: 'concept' | 'character' | 'tension' | 'ghost';
  opacity: number;
  metadata?: Record<string, unknown>;
}

interface TerrainEdge {
  sourceLabel: string;
  targetLabel: string;
  type: 'solid' | 'dotted' | 'contradiction';
}

// ─── State Detection ──────────────────────────────────────────────────────────

const HESITATION_PHRASES = [
  "i don't know", "i'm not sure", "i don't really", "i guess",
  "not sure", "kind of", "sort of", "i don't think", "i can't",
  "nothing really", "i have no idea",
];

function detectCreativeState(transcript: TranscriptEntry[]): CreativeState {
  const userMessages = transcript.filter(e => e.role === 'user');
  if (userMessages.length === 0) return 'generative';

  const recent = userMessages.slice(-3);
  const avgWordCount =
    recent.reduce((sum, m) => sum + m.content.split(/\s+/).length, 0) / recent.length;

  const lastContent = userMessages[userMessages.length - 1].content.toLowerCase();
  const hasHesitation = HESITATION_PHRASES.some(p => lastContent.includes(p));

  // Repetition: how much vocabulary from the last message already appeared earlier
  let repetitionScore = 0;
  if (userMessages.length >= 3) {
    const lastWords = new Set(
      lastContent.split(/\s+/).filter(w => w.length > 4)
    );
    const earlierText = userMessages
      .slice(0, -1)
      .map(m => m.content.toLowerCase())
      .join(' ');
    const earlierWords = new Set(earlierText.split(/\s+/).filter(w => w.length > 4));
    const overlap = [...lastWords].filter(w => earlierWords.has(w)).length;
    repetitionScore = lastWords.size > 0 ? overlap / lastWords.size : 0;
  }

  if (avgWordCount < 12 || (avgWordCount < 20 && repetitionScore > 0.6)) {
    return 'exhausted';
  }
  if (avgWordCount < 30 || hasHesitation || repetitionScore > 0.5) {
    return 'blocked';
  }
  return 'generative';
}

// ─── Question Type Selection ──────────────────────────────────────────────────

function selectQuestionType(state: CreativeState, depth: number): QuestionType {
  if (state === 'exhausted') return 'reflection';

  if (state === 'blocked') {
    // Blocked users need mirroring, not more pressure
    return depth < 4 ? 'reflection' : 'excavation';
  }

  // Generative: progress through the sequence as depth increases
  if (depth <= 1) return 'excavation';
  if (depth <= 3) return depth % 2 === 0 ? 'excavation' : 'pressure';
  if (depth <= 5) return depth % 2 === 0 ? 'pressure' : 'collision';
  return depth % 2 === 0 ? 'collision' : 'reflection';
}

// ─── Prompts ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Maieutic — a Socratic dialectic engine. You are a midwife, not an author.

ABSOLUTE RULES:
- Ask exactly ONE question. Never two. Never a statement followed by a question.
- Never generate creative content: no stories, no examples, no scenes, no poems.
- Never validate or praise. No "great", "interesting", "good", "exactly", "yes", etc.
- Never suggest a direction or offer an interpretation. Only excavate.
- Maximum 150 tokens. Most questions should be under 30 words.
- End with a question mark. Nothing after it.
- No preamble. No explanation. No soft opening. Just the question.

The output is the user's clarity, not your text. Silence is a feature.`;

const QUESTION_TYPE_INSTRUCTIONS: Record<QuestionType, string> = {
  excavation: `MODE: excavation — surface what is beneath the stated idea.
Dig under the surface. Find the assumption the stated idea rests on.
Ask about the thing the user is circling without naming.`,

  pressure: `MODE: pressure — find the weakest load-bearing claim.
Identify the thing that sounds most certain. That is what to press.
What would collapse the whole structure if it were untrue?`,

  collision: `MODE: collision — force two distant concepts together.
Find two ideas from this conversation that have not yet touched.
Ask what it would mean if they were secretly the same thing, or direct opposites.`,

  reflection: `MODE: reflection — mirror back what has been avoided.
What has the user circled around without naming?
What is the thing they keep almost saying but don't?`,
};

// ─── Terrain Extraction ───────────────────────────────────────────────────────

async function extractTerrain(
  latestMessage: string,
  existingLabels: string[]
): Promise<{ nodes: TerrainNode[]; edges: TerrainEdge[] }> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    tools: [
      {
        name: 'update_terrain',
        description:
          'Extract concepts, characters, tensions, and ghosts from the user message to update the living terrain graph.',
        input_schema: {
          type: 'object' as const,
          properties: {
            nodes: {
              type: 'array',
              description: 'New or updated terrain nodes',
              items: {
                type: 'object',
                properties: {
                  label: {
                    type: 'string',
                    description: 'Short label, 1–3 words',
                  },
                  type: {
                    type: 'string',
                    enum: ['concept', 'character', 'tension', 'ghost'],
                    description:
                      'concept=idea/theme, character=person/persona, tension=conflict, ghost=implied but unnamed',
                  },
                  opacity: {
                    type: 'number',
                    description:
                      '0.2–1.0: how present and certain this element is. Ghosts are low opacity.',
                  },
                },
                required: ['label', 'type', 'opacity'],
              },
            },
            edges: {
              type: 'array',
              description: 'Relationships between nodes (use labels)',
              items: {
                type: 'object',
                properties: {
                  sourceLabel: { type: 'string' },
                  targetLabel: { type: 'string' },
                  type: {
                    type: 'string',
                    enum: ['solid', 'dotted', 'contradiction'],
                    description:
                      'solid=clear connection, dotted=possible, contradiction=opposing forces',
                  },
                },
                required: ['sourceLabel', 'targetLabel', 'type'],
              },
            },
          },
          required: ['nodes', 'edges'],
        },
      },
    ],
    tool_choice: { type: 'auto' },
    messages: [
      {
        role: 'user',
        content: `Extract the creative terrain from this message. Be sparse — only what is genuinely present.

Node types: concept (ideas/themes), character (people/personas), tension (conflicts/contradictions), ghost (implied but not directly named).
Edge types: solid (clear connection), dotted (possible/implied connection), contradiction (opposing forces).

Already in terrain: ${existingLabels.length ? existingLabels.join(', ') : 'nothing yet'}.
Only add NEW elements not already listed, or update opacity of existing ones if their certainty has changed.
Maximum 4 nodes and 3 edges per message.

User message: "${latestMessage}"`,
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === 'tool_use' && block.name === 'update_terrain') {
      return block.input as { nodes: TerrainNode[]; edges: TerrainEdge[] };
    }
  }
  return { nodes: [], edges: [] };
}

// ─── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    transcript: TranscriptEntry[];
    existingNodeLabels?: string[];
  };

  const { transcript, existingNodeLabels = [] } = body;
  const userMessages = transcript.filter(e => e.role === 'user');

  if (userMessages.length === 0) {
    return new Response(JSON.stringify({ error: 'No user message in transcript' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const depth = userMessages.length;
  const creativeState = detectCreativeState(transcript);
  const questionType = selectQuestionType(creativeState, depth);
  const latestUserMessage = userMessages[userMessages.length - 1].content;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        // 1. Emit state + question type immediately
        send('state', { creative_state: creativeState, question_type: questionType });

        // 2. Start terrain extraction concurrently (Haiku — fast)
        const terrainPromise = extractTerrain(latestUserMessage, existingNodeLabels);

        // 3. Stream the question from Sonnet
        const questionStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 150,
          system: `${SYSTEM_PROMPT}\n\n${QUESTION_TYPE_INSTRUCTIONS[questionType]}`,
          messages: transcript.map(e => ({
            role: e.role as 'user' | 'assistant',
            content: e.content,
          })),
        });

        for await (const chunk of questionStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            send('token', { content: chunk.delta.text });
          }
        }

        // 4. Emit terrain once question stream is done
        const terrain = await terrainPromise;
        send('terrain', terrain);

        // 5. Signal completion
        send('done', {});
      } catch (err) {
        send('error', {
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
