# Maieutic

**Most thinking tools do one of two things: they complete your thought, or they give you a blank canvas.**

Neither helps when you're stuck in a loop — when you can't see what's missing, what you're avoiding, or where two ideas are actually in tension. Maieutic is a different kind of tool. It doesn't generate content for you. It pushes back on your thinking.

You paste what's in your head. The AI maps it as a terrain of connected concepts, then intervenes — not to answer, but to interrogate. It surfaces absences. It names contradictions. It asks the question you weren't asking.

→ **[Try the live demo](https://maieutic-roan.vercel.app)** *(no account needed, no API key required)*

---

## The problem it solves

When people think alone, they tend to reinforce what they already believe. Creative tools that generate content bypass the hard part entirely. Tools that do nothing leave you where you started.

Maieutic sits in the gap: it's a thinking partner that never completes your sentences, only disrupts them.

---

## How it works — the three-act pipeline

The product is structured as three acts, each with a distinct function:

**Act 1 — Intake.** You paste raw text: a problem, a draft, an idea you can't resolve. The AI analyzes it and returns a first question plus an initial map of concepts and their relationships.

**Act 2 — Exploration.** An interactive terrain (built on ReactFlow) where concepts live as nodes. The AI intervenes sporadically — not continuously — adding ghost nodes for ideas you haven't named, edges for connections you haven't made, and questions calibrated to your current state. It detects whether you're generative, blocked, or exhausted, and adjusts its interventions accordingly.

**Act 3 — Synthesis.** A structured read of the full terrain: what was resolved, what remains open, what was actively avoided, and what's worth exporting.

---

## Architecture

```
page.tsx (server)
└─ isDemoMode() → MaieuticApp (client)
   ├─ IntakeZone          — Act 1: text input → /api/intake
   ├─ TerrainCanvas       — Act 2: ReactFlow terrain, live AI interventions
   │   └─ Ghost nodes, tension edges, absence markers
   └─ SynthesisPanel      — Act 3: resolved / open / avoided / export
```

**API routes (all Edge Runtime, SSE streaming):**

| Route | Role |
|---|---|
| `/api/intake` | Analyzes input text, returns first question + initial nodes/edges |
| `/api/dialectic` | SSE stream — Sonnet 4.6 generates questions, Haiku 4.5 extracts terrain in parallel |
| `/api/intervention` | Generates ghost nodes, new edges, or follow-up questions from current terrain state |
| `/api/synthesis` | Final terrain read → resolved, open, avoided, export suggestions |
| `/api/underside` | Analyzes shadow material — what was avoided across the session |

**Why two models?** Sonnet handles the creative and philosophical layer (question generation, state detection). Haiku handles the structural extraction (terrain updates, node/edge parsing). Running them in parallel on each turn keeps latency low without sacrificing quality on either task.

---

## Technical decisions worth noting

**Demo mode is a first-class feature.** Without an API key, the app runs a fully scripted session — Lucas the screenwriter working through a blocked script. Every interaction is pre-timed and deterministic. This was a deliberate design decision: the product should be fully evaluable by anyone, without friction.

**The AI writes into the terrain, not into a chat box.** There is no conversation thread. AI interventions appear as new nodes and edges directly on the canvas. This was a constraint I imposed early — the medium forces the AI to think spatially, not discursively.

**Creative state detection.** The dialectic route infers the user's state from transcript signals (words per message, hesitation patterns, repetition) and selects a question type: `excavation → pressure → collision → reflection`. The user never sees this — it's an invisible layer that shapes the quality of intervention.

---

## Tech stack

- **Next.js App Router** + TypeScript + Tailwind
- **ReactFlow** — primary interaction surface (not a visualization layer)
- **Anthropic SDK** — `claude-sonnet-4-6` for questions, `claude-haiku-4-5-20251001` for terrain extraction
- **Supabase** — optional persistence layer (app works fully without it)

---

## Run it locally

```bash
git clone https://github.com/greg-tnh-ngo/maieutic
cd maieutic
npm install
# Optional: add ANTHROPIC_API_KEY to .env.local
# Without it, demo mode activates automatically
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Why I built this

I kept running into the same problem: the more I thought about something alone, the more I reinforced my existing frame. Every tool I tried either generated content for me (which bypassed the thinking) or gave me a blank page (which left me where I started). I wanted something that would push back — something that asked the question I wasn't asking.

Maieutic is named after the Socratic method: the idea that knowledge isn't transmitted, it's drawn out through questioning.
