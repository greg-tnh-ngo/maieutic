'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider, ReactFlow, Background } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import type { ExportTemplate } from '../api/export-templates/route';

// ─── Mock community templates ─────────────────────────────────────────────────

type MockupType = 'questions' | 'character' | 'narrative' | 'list' | 'table';

const COMMUNITY_TEMPLATES: Array<{ username: string; label: string; description: string; mockupType: MockupType }> = [
  { username: 'sophie_w', label: 'Character arc', description: 'Bullet points tracing the emotional journey of the central figure', mockupType: 'list' },
  { username: 'narrateur_k', label: 'Scene seeds', description: 'Three unwritten scenes the terrain is gesturing toward', mockupType: 'narrative' },
  { username: 'felix_m', label: 'Dialogue fragments', description: 'Lines overheard between the tension nodes', mockupType: 'narrative' },
  { username: 'ana_r', label: 'Contradiction table', description: 'What was said vs. what was avoided, in two columns', mockupType: 'table' },
  { username: 'the_silent_draft', label: 'Ghost inventory', description: 'Everything named but never defined', mockupType: 'list' },
  { username: 'mara_b', label: 'First line', description: 'The opening sentence the terrain is gesturing toward', mockupType: 'narrative' },
];

// ─── Template visual mockup ───────────────────────────────────────────────────

type MockLine = { kind: 'h1' | 'h2' | 'text' | 'bullet' | 'numbered' | 'table-row' | 'gap'; width?: string };

const MOCKUP_STRUCTURES: Record<MockupType, MockLine[]> = {
  questions: [
    { kind: 'h1', width: '62%' },
    { kind: 'gap' },
    { kind: 'numbered', width: '88%' },
    { kind: 'numbered', width: '74%' },
    { kind: 'numbered', width: '92%' },
    { kind: 'numbered', width: '68%' },
    { kind: 'numbered', width: '80%' },
  ],
  character: [
    { kind: 'h1', width: '52%' },
    { kind: 'gap' },
    { kind: 'h2', width: '42%' },
    { kind: 'text', width: '82%' },
    { kind: 'text', width: '68%' },
    { kind: 'gap' },
    { kind: 'h2', width: '38%' },
    { kind: 'text', width: '78%' },
  ],
  narrative: [
    { kind: 'h1', width: '58%' },
    { kind: 'gap' },
    { kind: 'text', width: '96%' },
    { kind: 'text', width: '88%' },
    { kind: 'text', width: '72%' },
    { kind: 'gap' },
    { kind: 'text', width: '94%' },
    { kind: 'text', width: '80%' },
  ],
  list: [
    { kind: 'h1', width: '68%' },
    { kind: 'gap' },
    { kind: 'bullet', width: '82%' },
    { kind: 'bullet', width: '70%' },
    { kind: 'bullet', width: '88%' },
    { kind: 'bullet', width: '76%' },
    { kind: 'bullet', width: '64%' },
  ],
  table: [
    { kind: 'h1', width: '64%' },
    { kind: 'gap' },
    { kind: 'table-row', width: '90%' },
    { kind: 'table-row', width: '90%' },
    { kind: 'table-row', width: '90%' },
    { kind: 'table-row', width: '90%' },
  ],
};

function parseMockupFromContent(content: string): MockLine[] {
  return content
    .split('\n')
    .filter(l => l.trim())
    .slice(0, 9)
    .map(line => {
      if (line.startsWith('# ')) return { kind: 'h1' as const, width: `${Math.min(90, 30 + line.length * 2)}%` };
      if (line.startsWith('## ')) return { kind: 'h2' as const, width: `${Math.min(75, 25 + line.length * 2)}%` };
      if (/^[-*]\s/.test(line)) return { kind: 'bullet' as const, width: `${50 + (line.length % 35)}%` };
      if (/^\d+\./.test(line)) return { kind: 'numbered' as const, width: `${50 + (line.length % 35)}%` };
      return { kind: 'text' as const, width: `${60 + (line.length % 30)}%` };
    });
}

function TemplateMockup({ content, mockupType }: { content?: string; mockupType?: MockupType }) {
  const lines = content ? parseMockupFromContent(content) : MOCKUP_STRUCTURES[mockupType ?? 'list'];

  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.07)',
      padding: '10px 12px',
      height: 92,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      flexShrink: 0,
    }}>
      {lines.map((line, i) => {
        if (line.kind === 'gap') return <div key={i} style={{ height: 3 }} />;

        if (line.kind === 'table-row') {
          return (
            <div key={i} style={{ display: 'flex', gap: 4, width: line.width }}>
              <div style={{ flex: 1, height: 3, background: 'rgba(20,20,30,0.1)', borderRadius: 1 }} />
              <div style={{ width: 1, background: 'rgba(20,20,30,0.08)' }} />
              <div style={{ flex: 1, height: 3, background: 'rgba(20,20,30,0.1)', borderRadius: 1 }} />
            </div>
          );
        }

        const barColor = line.kind === 'h1' ? 'rgba(20,20,30,0.55)' : line.kind === 'h2' ? 'rgba(20,20,30,0.38)' : 'rgba(20,20,30,0.13)';
        const barHeight = line.kind === 'h1' ? 5 : line.kind === 'h2' ? 4 : 3;

        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {line.kind === 'bullet' && (
              <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(20,20,30,0.22)', flexShrink: 0, marginTop: 0 }} />
            )}
            {line.kind === 'numbered' && (
              <div style={{ width: 7, height: 7, borderRadius: '50%', border: '1px solid rgba(20,20,30,0.18)', flexShrink: 0 }} />
            )}
            <div style={{ height: barHeight, width: line.width, background: barColor, borderRadius: 1, maxWidth: '100%' }} />
          </div>
        );
      })}
    </div>
  );
}

// ─── Session data type ────────────────────────────────────────────────────────

interface SessionData {
  nodes: Node[];
  edges: Edge[];
  synthesis: { resolved: string[]; open: string[]; avoided: string[] };
  transcript: Array<{ role: string; content: string }>;
  isDemo: boolean;
}

// ─── Graph download (canvas renderer) ────────────────────────────────────────

function downloadGraphAsImage(nodes: Node[], edges: Edge[]) {
  const W = 1400, H = 900;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#0d0d0f';
  ctx.fillRect(0, 0, W, H);

  if (nodes.length === 0) {
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maieutic-terrain.png';
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
    return;
  }

  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs) + 120;
  const minY = Math.min(...ys), maxY = Math.max(...ys) + 50;
  const contentW = maxX - minX || 1;
  const contentH = maxY - minY || 1;
  const padding = 80;
  const scale = Math.min((W - padding * 2) / contentW, (H - padding * 2) / contentH, 2);
  const offsetX = padding + ((W - padding * 2) - contentW * scale) / 2;
  const offsetY = padding + ((H - padding * 2) - contentH * scale) / 2;

  const tx = (x: number) => offsetX + (x - minX) * scale;
  const ty = (y: number) => offsetY + (y - minY) * scale;
  const nW = 110 * scale;
  const nH = 34 * scale;

  // Edges
  edges.forEach(edge => {
    const src = nodes.find(n => n.id === edge.source);
    const tgt = nodes.find(n => n.id === edge.target);
    if (!src || !tgt) return;
    ctx.beginPath();
    ctx.moveTo(tx(src.position.x) + nW / 2, ty(src.position.y) + nH / 2);
    ctx.lineTo(tx(tgt.position.x) + nW / 2, ty(tgt.position.y) + nH / 2);
    const kind = (edge.data as { edgeKind?: string } | undefined)?.edgeKind;
    ctx.strokeStyle = kind === 'contradiction' ? '#8b2020' : 'rgba(232,232,240,0.28)';
    ctx.setLineDash(kind === 'dotted' ? [6 * scale, 4 * scale] : []);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Nodes
  nodes.forEach(node => {
    const x = tx(node.position.x);
    const y = ty(node.position.y);
    const label = String((node.data as { label?: string } | undefined)?.label ?? '');
    const kind = node.type ?? 'concept';

    if (kind === 'ghost') {
      ctx.fillStyle = 'rgba(58,58,106,0.25)';
      ctx.strokeStyle = 'rgba(58,58,106,0.7)';
      ctx.setLineDash([4 * scale, 3 * scale]);
    } else if (kind === 'tension') {
      ctx.fillStyle = 'rgba(139,32,32,0.15)';
      ctx.strokeStyle = '#8b2020';
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle = 'rgba(232,232,240,0.05)';
      ctx.strokeStyle = 'rgba(232,232,240,0.4)';
      ctx.setLineDash([]);
    }

    ctx.fillRect(x, y, nW, nH);
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, nW, nH);
    ctx.setLineDash([]);

    ctx.fillStyle = kind === 'ghost' ? 'rgba(232,232,240,0.5)' : '#e8e8f0';
    ctx.font = `${Math.max(10, 12 * scale)}px system-ui, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + nW / 2, y + nH / 2);
  });

  canvas.toBlob(blob => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maieutic-terrain.png';
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// ─── File download helper ─────────────────────────────────────────────────────

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Template card ────────────────────────────────────────────────────────────

function TemplateCard({
  label,
  description,
  onClick,
  loading,
  isPlus,
}: {
  label: string;
  description?: string;
  onClick: () => void;
  loading?: boolean;
  isPlus?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(232,232,240,0.06)' : 'rgba(232,232,240,0.02)',
        border: '1px solid',
        borderColor: hovered ? 'rgba(232,232,240,0.22)' : 'rgba(232,232,240,0.09)',
        padding: isPlus ? '12px 18px' : '12px 16px',
        textAlign: 'left',
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.15s ease',
        minWidth: isPlus ? 60 : 160,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        opacity: loading ? 0.5 : 1,
      }}
    >
      {isPlus ? (
        <span style={{ color: 'rgba(232,232,240,0.5)', fontSize: '1.1rem', fontFamily: 'system-ui', lineHeight: 1 }}>+</span>
      ) : (
        <>
          <span style={{ color: '#e8e8f0', fontSize: 10, letterSpacing: '0.08em', fontFamily: 'system-ui, sans-serif', textTransform: 'uppercase' }}>
            {loading ? '···' : label}
          </span>
          {description && (
            <span style={{ color: 'rgba(232,232,240,0.35)', fontSize: 10, fontFamily: 'Georgia, serif', fontStyle: 'italic', lineHeight: 1.4 }}>
              {description}
            </span>
          )}
        </>
      )}
    </button>
  );
}

// ─── Community popup ──────────────────────────────────────────────────────────

function ArtifactCard({
  label,
  description,
  content,
  mockupType,
  username,
  onClick,
}: {
  label: string;
  description: string;
  content?: string;
  mockupType?: MockupType;
  username?: string;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#f0f0f0' : '#fafafa',
        border: `1px solid ${hovered ? 'rgba(0,0,0,0.14)' : 'rgba(0,0,0,0.08)'}`,
        padding: 0,
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <TemplateMockup content={content} mockupType={mockupType} />
      <div style={{ padding: '8px 12px 10px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        {username && (
          <span style={{ color: 'rgba(0,0,0,0.3)', fontSize: 9, fontFamily: 'system-ui', letterSpacing: '0.04em', display: 'block', marginBottom: 2 }}>
            @{username}
          </span>
        )}
        <span style={{ color: 'rgba(0,0,0,0.75)', fontSize: 11, fontFamily: 'system-ui', fontWeight: 500, display: 'block', marginBottom: 2 }}>
          {label}
        </span>
        <span style={{ color: 'rgba(0,0,0,0.42)', fontSize: 10, fontFamily: 'system-ui', lineHeight: 1.4, display: 'block' }}>
          {description}
        </span>
      </div>
    </button>
  );
}

function CommunityPopup({
  yourTemplates,
  onSelect,
  onClose,
}: {
  yourTemplates: ExportTemplate[];
  onSelect: (label: string, description: string, content?: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fade-in 0.15s ease',
        backdropFilter: 'blur(2px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#f5f5f3',
          border: '1px solid rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: 720,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.18)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
          background: '#fff',
        }}>
          <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 13, fontFamily: 'system-ui', fontWeight: 500 }}>
            Templates
          </span>
          <button
            onClick={onClose}
            style={{ color: 'rgba(0,0,0,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, fontFamily: 'system-ui', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem' }}>
          {/* Your templates */}
          <div style={{ marginBottom: '1.75rem' }}>
            <span style={{
              color: 'rgba(0,0,0,0.35)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui',
              fontWeight: 500,
              display: 'block',
              marginBottom: '0.75rem',
            }}>
              Yours
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {yourTemplates.map(t => (
                <ArtifactCard
                  key={t.id}
                  label={t.label}
                  description={t.description}
                  content={t.content}
                  onClick={() => onSelect(t.label, t.description, t.content)}
                />
              ))}
            </div>
          </div>

          {/* Community templates */}
          <div>
            <span style={{
              color: 'rgba(0,0,0,0.35)',
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui',
              fontWeight: 500,
              display: 'block',
              marginBottom: '0.75rem',
            }}>
              Community
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
              {COMMUNITY_TEMPLATES.map(t => (
                <ArtifactCard
                  key={t.username + t.label}
                  label={t.label}
                  description={t.description}
                  mockupType={t.mockupType}
                  username={t.username}
                  onClick={() => onSelect(t.label, t.description)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Static graph ─────────────────────────────────────────────────────────────

function StaticGraph({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      preventScrolling={false}
      fitView
      fitViewOptions={{ padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="rgba(232,232,240,0.03)" gap={32} />
    </ReactFlow>
  );
}

// ─── Export page ──────────────────────────────────────────────────────────────

export default function ExportPage() {
  const router = useRouter();
  const [session, setSession] = useState<SessionData | null>(null);
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [customPrompt, setCustomPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load session data
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('maieutic_export');
      if (raw) setSession(JSON.parse(raw) as SessionData);
    } catch {
      // ignore
    }
  }, []);

  // Fetch templates once session is loaded
  useEffect(() => {
    if (!session) return;
    setLoadingTemplates(true);
    fetch('/api/export-templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ synthesis: session.synthesis, transcript: session.transcript }),
    })
      .then(r => r.json())
      .then((data: ExportTemplate[]) => setTemplates(data))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, [session]);

  const handleDownloadTemplate = useCallback((content: string, label: string) => {
    const filename = `maieutic-${label.toLowerCase().replace(/\s+/g, '-')}.md`;
    downloadMarkdown(content, filename);
  }, []);

  const handleTemplateClick = useCallback((template: ExportTemplate) => {
    handleDownloadTemplate(template.content, template.label);
  }, [handleDownloadTemplate]);

  const handleCommunitySelect = useCallback(async (label: string, description: string, content?: string) => {
    setShowCommunity(false);
    const filename = `maieutic-${label.toLowerCase().replace(/\s+/g, '-')}.md`;
    if (content) {
      downloadMarkdown(content, filename);
      return;
    }
    if (!session) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/export-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${label}: ${description}`,
          synthesis: session.synthesis,
          transcript: session.transcript,
        }),
      });
      const { content: generated } = await res.json() as { content: string };
      downloadMarkdown(generated, filename);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }, [session]);

  const handleCustomSubmit = useCallback(async () => {
    if (!customPrompt.trim() || !session || generating) return;
    const prompt = customPrompt.trim();
    setGenerating(true);
    try {
      const res = await fetch('/api/export-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, synthesis: session.synthesis, transcript: session.transcript }),
      });
      const { content } = await res.json() as { content: string };
      downloadMarkdown(content, `maieutic-custom.md`);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  }, [customPrompt, session, generating]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d0d0f', position: 'relative', overflow: 'hidden' }}>

      {/* Back button */}
      <button
        onClick={() => router.back()}
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          color: 'rgba(232,232,240,0.2)',
          background: 'none',
          border: 'none',
          fontSize: 10,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        ← synthesis
      </button>

      {/* Graph (full screen, static) */}
      <ReactFlowProvider>
        <div style={{ width: '100%', height: '100%' }}>
          <StaticGraph nodes={session?.nodes ?? []} edges={session?.edges ?? []} />
        </div>
      </ReactFlowProvider>

      {/* Download graph button */}
      <button
        onClick={() => downloadGraphAsImage(session?.nodes ?? [], session?.edges ?? [])}
        style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 10,
          color: 'rgba(232,232,240,0.3)',
          background: 'rgba(13,13,15,0.7)',
          border: '1px solid rgba(232,232,240,0.1)',
          fontSize: 9,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          padding: '7px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(4px)',
        }}
      >
        ↓ graph
      </button>

      {/* Centered overlay: text box + templates */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          width: '100%',
          maxWidth: 680,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: '1rem',
          padding: '0 1.5rem',
        }}
      >
        {/* Text input */}
        <div
          style={{
            background: 'rgba(13,13,15,0.88)',
            border: '1px solid rgba(232,232,240,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 14px',
            backdropFilter: 'blur(8px)',
          }}
        >
          <input
            ref={inputRef}
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
            placeholder="what do you want to export? describe it…"
            disabled={generating}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#e8e8f0',
              fontSize: '0.9rem',
              fontFamily: 'Georgia, serif',
              outline: 'none',
              padding: '14px 0',
              caretColor: '#e8e8f0',
            }}
          />
          {customPrompt.trim() && (
            <button
              onClick={handleCustomSubmit}
              disabled={generating}
              style={{
                color: generating ? 'rgba(232,232,240,0.2)' : 'rgba(232,232,240,0.45)',
                background: 'none',
                border: 'none',
                fontSize: 12,
                cursor: generating ? 'wait' : 'pointer',
                fontFamily: 'system-ui',
                flexShrink: 0,
                padding: 0,
              }}
            >
              {generating ? '···' : '↓'}
            </button>
          )}
        </div>

        {/* Template cards row */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'stretch' }}>
          {loadingTemplates
            ? [0, 1, 2].map(i => (
                <TemplateCard key={i} label="···" onClick={() => {}} loading />
              ))
            : templates.map(t => (
                <TemplateCard
                  key={t.id}
                  label={t.label}
                  description={t.description}
                  onClick={() => handleTemplateClick(t)}
                  loading={generating}
                />
              ))
          }
          <TemplateCard
            label="+"
            isPlus
            onClick={() => setShowCommunity(true)}
          />
        </div>
      </div>

      {/* Community popup */}
      {showCommunity && (
        <CommunityPopup
          yourTemplates={templates}
          onSelect={handleCommunitySelect}
          onClose={() => setShowCommunity(false)}
        />
      )}
    </div>
  );
}
