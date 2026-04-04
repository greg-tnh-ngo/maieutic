import { NextRequest, NextResponse } from 'next/server';
import { isDemoMode } from '../../lib/mode-detector';

const DEMO_CONTENT = `# Export — Maieutic Session\n\nThis session explored themes of return, guilt, and unresolved debt — the weight carried by those who leave and come back changed.\n\n## What emerged\n- The father-son relationship as an irreducible origin\n- Guilt as a form of loyalty to what was left behind\n\n## What remains open\n- The exact nature of the debt — to whom, for what\n- What "coming back" meant to him at nineteen\n\n## What was avoided\n- The relief of having left\n- The possibility that distance was necessary for survival\n`;

export async function POST(req: NextRequest) {
  if (isDemoMode()) {
    return NextResponse.json({ content: DEMO_CONTENT });
  }

  const { prompt, synthesis, transcript } = await req.json() as {
    prompt: string;
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
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Generate an export document for a writer based on their creative session.\n\nRequest: ${prompt}\n\nSynthesis:\n${synthesisText}\n\nTranscript:\n${transcriptText}\n\nWrite the requested document in markdown. Be specific, concrete, and immediately useful to the writer.`,
      },
    ],
  });

  const content = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('');

  return NextResponse.json({ content });
}
