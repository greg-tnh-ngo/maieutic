import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const client = new Anthropic();

interface TranscriptEntry {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are reading the shadow material of a creative conversation — what lies underneath what was said.

RULES:
- Write 3–4 brief, declarative observations in plain prose paragraphs.
- No hedging. No "perhaps", "might", "seems to", "could be". State what you see directly.
- No validation, no praise, no suggestions for what to do next.
- No creative content. You are an analyst, not a collaborator.
- Do not address the speaker directly. Write about the material.
- Maximum 180 words total.
- Do not label or number your observations. Let them flow as natural paragraphs.

Look specifically for:
— What has been circled without being named
— What is conspicuously absent despite being implied
— The recurring structure beneath the stated concern
— What the speaker appears to be protecting or avoiding`;

export async function POST(req: NextRequest) {
  const { transcript } = await req.json() as { transcript: TranscriptEntry[] };

  const userMessages = transcript.filter(e => e.role === 'user');
  if (userMessages.length < 3) {
    return new Response(
      JSON.stringify({ error: 'Minimum 3 exchanges required to reveal the underside' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const conversationText = transcript
    .map(e => `${e.role === 'user' ? 'SPEAKER' : 'QUESTION'}: ${e.content}`)
    .join('\n\n');

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const messageStream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 250,
          system: SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Read the underside of this creative session:\n\n${conversationText}`,
            },
          ],
        });

        for await (const chunk of messageStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            send('token', { content: chunk.delta.text });
          }
        }

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
