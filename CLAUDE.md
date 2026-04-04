# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What it is
A non-linear thought-mapping tool. The AI does not assist — it disrupts.
It intervenes sporadically in a graph space to surface absences,
unresolved tensions, and unexpected connections. It never generates content.

## Development commands
```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint
```

No automated tests. Manual verification via demo mode.

## DEMO MODE — CRITICAL
If `ANTHROPIC_API_KEY` is absent or does not start with `sk-ant-` in `.env.local`:
- Demo mode activates automatically (detected server-side in `app/lib/mode-detector.ts`)
- No Claude API calls are made
- All AI interventions are scripted (`app/lib/demo-script.ts`)
- A very discreet banner shows "demo mode" in the bottom-right corner
- In demo mode, press **L** to manually advance steps
- The full experience must work with no API key whatsoever

## Actual architecture

### Data flow
page.tsx (server)
└─ isDemoMode() → MaieuticApp.tsx (client, ReactFlowProvider)
└─ AppInner
├─ useDemoController() — demo mode orchestrator
├─ TerrainCanvas — ReactFlow
├─ IntakeZone — act 1
├─ SynthesisPanel — act 3
├─ NodeDetailPane — right panel (selected node)
└─ HistoryPanel — left overlay

### API routes (all Edge Runtime)
| Route | Role |
|-------|------|
| `/api/intake` | Analyzes incoming text, returns `firstPrompt` + initial nodes/edges |
| `/api/dialectic` | **Main route** — SSE streaming. Sonnet 4.6 generates the question, Haiku 4.5 extracts terrain in parallel. Returns `state`, `token`, `terrain`, `done`. |
| `/api/intervention` | Generates a ghost node, edge, or next question based on current terrain |
| `/api/synthesis` | Final terrain read → `SynthesisData` (resolved/open/avoided/exportSuggestions) |
| `/api/underside` | Analyzes "shadow material" — what was avoided in the conversation |

> **Note:** `MaieuticApp.tsx` currently calls `/api/intervention` for live responses, not `/api/dialectic`. The `/api/dialectic` route is the full SSE implementation with creative state detection (generative/blocked/exhausted).

### `/api/dialectic` logic
- Detects the user's creative state by analyzing the transcript (words/message, hesitations, repetition)
- Selects a question type: `excavation` → `pressure` → `collision` → `reflection`
- SSE stream: Sonnet generates the question + Haiku extracts terrain in parallel (tool use `update_terrain`)

### Components not listed in the target structure
- `app/components/MaieuticApp.tsx` — main client shell, manages all live and demo state
- `app/components/EdgeTypes.tsx` — custom ReactFlow edge types
- `app/components/NodeDetailPane.tsx` — right panel on node click
- `app/components/HistoryPanel.tsx` — questions/responses/nodes history
- `app/lib/db.ts` / `app/lib/supabase.ts` — Supabase persistence (optional)

### Demo / live duality in MaieuticApp
All state is duplicated: `live*` variables for live mode, `demo.*` for demo mode. Rendering chooses between the two via ternaries (`isDemo ? demo.nodes : liveNodes`). Handlers like `handleDeleteNode` are no-ops in demo mode.

## Three-act architecture
1. **INTAKE** — text paste zone (`IntakeZone.tsx`), calls `/api/intake`
2. **EXPLORATION** — interactive ReactFlow terrain, question at bottom, response textarea, ghost nodes
3. **SYNTHESIS** — `SynthesisPanel` on the right + read-only terrain on the left

## Tech stack
- Next.js App Router, TypeScript, Tailwind
- ReactFlow for the terrain (primary interaction surface, not a secondary visualization)
- `@anthropic-ai/sdk` — claude-sonnet-4-6 for questions, claude-haiku-4-5-20251001 for terrain extraction
- Supabase for persistence (optional, do not block on this)

## Design system
- Background: `#0d0d0f`
- Primary text: `#e8e8f0`
- User nodes: white, opaque
- AI nodes (absence/suggestion): `#3a3a6a`, dashed, slightly transparent
- Unresolved tension: `#8b2020`
- Question font: Georgia serif
- Interface font: system-ui
- No gradients, no glassmorphism
- Inline styles (`style={{}}`) everywhere — no Tailwind classes on main components

## Node types
- `concept`: idea placed by the user, solid white
- `tension`: identified contradiction, `#8b2020` border
- `ghost`: AI-suggested node, dashed `#3a3a6a`
- `absence`: AI-named empty zone, very transparent

## Edge types
- `solid`: connection established by the user
- `dotted`: AI-suggested connection
- `contradiction`: red `#8b2020` edge between two nodes in tension

## Terrain behavior
- Two levels: macro (overview) / micro (zoomed into cluster)
- At micro zoom: rest of terrain fades to 20% opacity
- Nodes are draggable and manually connectable by drag
- The AI does not speak in a text box — it writes into the terrain
- AI interventions appear as new ghost nodes or new edges
- A small note floats on hover over ghost nodes (not permanently displayed)

## Inferred modes (never shown to the user)
- `focus`: user stays long on one cluster → reduce peripheral interventions
- `exploration`: broad movements → increase peripheral suggestions
- `consolidation`: few new nodes, lots of repositioning → point out redundancies

## Demo script — Lucas the screenwriter
The demo replays a pre-written session with precise timing.
See `app/lib/demo-script.ts` for the full script.
Steps:
T+0s    Show intake zone with placeholder
T+3s    Lucas pastes his text (simulated pre-written text)
T+5s    Silent analysis, discreet spinner
T+8s    First prompt: "What did he leave behind that he couldn't carry with him?"
T+15s   Simulated Lucas response (typing effect)
T+20s   3 nodes: "return" "guilt" "home"
T+30s   Second AI question
T+40s   Simulated response
T+50s   New nodes + first edge
T+70s   Ghost node "debt" dashed between guilt and home
T+90s   Lucas moves the node (animated)
T+110s  Macro view visible, two distinct clusters
T+130s  Empty zone between clusters pulses softly
T+150s  Ghost node "transit" in the empty zone
T+180s  Synthesis button active
T+190s  Synthesis panel opens
T+210s  Export suggestions

## What NOT to build
- Conversational chat box
- Multi-project dashboard
- Onboarding tutorial
- Any creative content generation
- Push notifications or intrusive alerts
- Visible or user-selectable modes