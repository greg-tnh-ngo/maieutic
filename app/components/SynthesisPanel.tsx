'use client';

import { useState } from 'react';
import { SynthesisData, ExportSuggestion } from '../lib/demo-script';

// ─── Export preview modal ─────────────────────────────────────────────────────

function ExportModal({
  suggestion,
  onClose,
}: {
  suggestion: ExportSuggestion;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');

  const handleDownload = () => {
    const blob = new Blob([suggestion.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `maieutic-${suggestion.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,13,15,0.88)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        animation: 'fade-in 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#0d0d0f',
          border: '1px solid rgba(232,232,240,0.1)',
          width: '100%',
          maxWidth: 620,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid rgba(232,232,240,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ color: 'rgba(232,232,240,0.25)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'system-ui' }}>
            {suggestion.label}
          </span>
          <button onClick={onClose} style={{ color: 'rgba(232,232,240,0.2)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontFamily: 'system-ui' }}>✕</button>
        </div>

        {/* Markdown preview */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem', borderBottom: '1px solid rgba(232,232,240,0.07)' }}>
          <pre
            style={{
              margin: 0,
              color: 'rgba(232,232,240,0.75)',
              fontFamily: 'Georgia, serif',
              fontSize: '0.85rem',
              lineHeight: 1.8,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {suggestion.markdown}
          </pre>
        </div>

        {/* Feedback + download footer */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <input
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
            placeholder="is this good enough? describe what to adjust…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(232,232,240,0.1)',
              color: '#e8e8f0',
              fontSize: 10,
              fontFamily: 'system-ui, sans-serif',
              outline: 'none',
              padding: '4px 0',
              caretColor: '#e8e8f0',
            }}
          />
          <button
            onClick={handleDownload}
            style={{
              color: 'rgba(232,232,240,0.5)',
              background: 'none',
              border: '1px solid rgba(232,232,240,0.12)',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              padding: '5px 12px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            ↓ save
          </button>
        </div>
      </div>
    </div>
  );
}

interface SynthesisPanelProps {
  data: SynthesisData;
  isDemo: boolean;
}

function Section({
  title,
  items,
  color,
}: {
  title: string;
  items: string[];
  color: string;
}) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <span
        style={{
          color,
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          display: 'block',
          marginBottom: '0.75rem',
        }}
      >
        {title}
      </span>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item, i) => (
          <li
            key={i}
            style={{
              fontSize: '0.85rem',
              lineHeight: 1.7,
              color: 'rgba(232,232,240,0.7)',
              fontFamily: 'Georgia, serif',
              paddingLeft: '0.75rem',
              borderLeft: `1px solid ${color}`,
            }}
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExportCard({
  suggestion,
  onExport,
}: {
  suggestion: ExportSuggestion;
  onExport: (s: ExportSuggestion) => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onExport(suggestion)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'rgba(232,232,240,0.04)' : 'transparent',
        border: '1px solid',
        borderColor: hovered ? 'rgba(232,232,240,0.2)' : 'rgba(232,232,240,0.08)',
        padding: '10px 14px',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'all 0.15s',
        width: '100%',
      }}
    >
      <div
        style={{
          color: '#e8e8f0',
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 3,
        }}
      >
        {suggestion.label}
      </div>
      <div
        style={{
          color: 'rgba(232,232,240,0.4)',
          fontSize: 10,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        {suggestion.description}
      </div>
    </button>
  );
}

export default function SynthesisPanel({ data, isDemo }: SynthesisPanelProps) {
  const [customFormat, setCustomFormat] = useState('');
  const [showExports, setShowExports] = useState(true);
  const [previewSuggestion, setPreviewSuggestion] = useState<ExportSuggestion | null>(null);

  const handleExport = (suggestion: ExportSuggestion) => {
    setPreviewSuggestion(suggestion);
  };

  const handleCustomExport = () => {
    if (!customFormat.trim()) return;
    const markdown = `# ${customFormat}\n\n## Emerged\n${data.resolved.map(r => `- ${r}`).join('\n')}\n\n## Still open\n${data.open.map(o => `- ${o}`).join('\n')}\n\n## Avoided\n${data.avoided.map(a => `- ${a}`).join('\n')}\n`;
    setPreviewSuggestion({ id: 'custom', label: customFormat, description: '', markdown });
  };

  return (
    <>
    {previewSuggestion && (
      <ExportModal suggestion={previewSuggestion} onClose={() => setPreviewSuggestion(null)} />
    )}
    <div
      style={{
        width: '100%',
        height: '100%',
        background: '#0d0d0f',
        borderLeft: '1px solid rgba(232,232,240,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slide-in-right 0.4s ease forwards',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1.5rem 1.75rem 1rem',
          borderBottom: '1px solid rgba(232,232,240,0.07)',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: 'rgba(232,232,240,0.25)',
            fontSize: 9,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          — synthesis
        </span>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '1.5rem 1.75rem' }}>
        <Section title="Emerged" items={data.resolved} color="rgba(232,232,240,0.35)" />
        <Section title="Still open" items={data.open} color="rgba(232,232,240,0.25)" />
        <Section title="Avoided" items={data.avoided} color="#8b2020" />

        {/* Export section */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(232,232,240,0.07)', paddingTop: '1.5rem' }}>
          <button
            onClick={() => setShowExports(v => !v)}
            style={{
              color: 'rgba(232,232,240,0.2)',
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '1rem',
              display: 'block',
            }}
          >
            {showExports ? '▾' : '▸'} export
          </button>

          {showExports && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.exportSuggestions.map(s => (
                <ExportCard key={s.id} suggestion={s} onExport={handleExport} />
              ))}

              {/* Custom format */}
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: 8 }}>
                <input
                  value={customFormat}
                  onChange={e => setCustomFormat(e.target.value)}
                  placeholder={isDemo ? 'describe the format you want' : 'describe the format you want'}
                  disabled={isDemo}
                  onKeyDown={e => e.key === 'Enter' && handleCustomExport()}
                  style={{
                    flex: 1,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(232,232,240,0.1)',
                    color: '#e8e8f0',
                    fontSize: 10,
                    fontFamily: 'system-ui, sans-serif',
                    outline: 'none',
                    padding: '4px 0',
                    caretColor: '#e8e8f0',
                  }}
                />
                {!isDemo && customFormat.trim() && (
                  <button
                    onClick={handleCustomExport}
                    style={{
                      color: 'rgba(232,232,240,0.4)',
                      background: 'none',
                      border: 'none',
                      fontSize: 10,
                      cursor: 'pointer',
                      fontFamily: 'system-ui, sans-serif',
                      letterSpacing: '0.1em',
                      padding: 0,
                    }}
                  >
                    ↓
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
