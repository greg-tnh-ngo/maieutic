'use client';

import React, { useState, useEffect, useRef } from 'react';

interface IntakeZoneProps {
  isDemo: boolean;
  demoText?: string;
  isTypingPaste?: boolean;
  typedText?: string;
  showSpinner?: boolean;
  onSubmit: (text: string) => void;
}

export default function IntakeZone({
  isDemo,
  demoText = '',
  isTypingPaste = false,
  typedText = '',
  showSpinner = false,
  onSubmit,
}: IntakeZoneProps) {
  const [liveText, setLiveText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isDemo) textareaRef.current?.focus();
  }, [isDemo]);

  const displayText = isDemo ? typedText : liveText;
  const canSubmit = !isDemo && liveText.trim().length > 0;

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '4rem',
        background: '#0d0d0f',
        animation: 'fade-in 0.6s ease',
      }}
    >
      <div style={{ width: '100%', maxWidth: 620, display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* Header */}
        <span
          style={{
            color: 'rgba(232,232,240,0.2)',
            fontSize: 10,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          — intake

        </span>

        {/* Textarea */}
        <div style={{ position: 'relative' }}>
          {isDemo ? (
            <div
              style={{
                minHeight: 220,
                color: 'rgba(232,232,240,0.75)',
                fontFamily: 'Georgia, serif',
                fontSize: '0.95rem',
                lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}
            >
              {displayText}
              {isTypingPaste && (
                <span className="cursor-blink" style={{ opacity: 0.5 }}>|</span>
              )}
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={liveText}
              onChange={e => setLiveText(e.target.value)}
              placeholder="Drop something here — a draft, notes, an intuition."
              rows={10}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: '1px solid rgba(232,232,240,0.08)',
                color: '#e8e8f0',
                fontFamily: 'Georgia, serif',
                fontSize: '0.95rem',
                lineHeight: 1.8,
                resize: 'none',
                outline: 'none',
                paddingBottom: '1rem',
                caretColor: '#e8e8f0',
              }}
            />
          )}
        </div>

        {/* Footer row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Spinner */}
          {showSpinner ? (
            <span
              style={{
                color: 'rgba(232,232,240,0.2)',
                fontSize: 10,
                letterSpacing: '0.15em',
                fontFamily: 'system-ui, sans-serif',
                fontStyle: 'italic',
              }}
            >
              reading…
            </span>
          ) : (
            <span />
          )}

          {/* Submit button (live only) */}
          {!isDemo && (
            <button
              onClick={() => canSubmit && onSubmit(liveText)}
              disabled={!canSubmit}
              style={{
                color: canSubmit ? '#e8e8f0' : 'rgba(232,232,240,0.2)',
                background: 'none',
                border: '1px solid',
                borderColor: canSubmit ? 'rgba(232,232,240,0.25)' : 'rgba(232,232,240,0.07)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                fontFamily: 'system-ui, sans-serif',
                padding: '7px 16px',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s',
              }}
            >
              begin exploration
            </button>
          )}
        </div>

        {/* MCP connections */}
        <McpSources />
      </div>
    </div>
  );
}

// ─── MCP logo SVGs ────────────────────────────────────────────────────────────

const logos: Record<string, React.ReactElement> = {
  notion: (
    <svg width="13" height="13" viewBox="0 0 100 100" fill="currentColor">
      <rect x="8" y="8" width="84" height="84" rx="14" fill="none" stroke="currentColor" strokeWidth="8"/>
      <path d="M28 25h8l28 38V25h8v50h-8L36 37v38h-8z"/>
    </svg>
  ),
  obsidian: (
    <svg width="13" height="13" viewBox="0 0 100 100" fill="currentColor">
      <polygon points="50,6 80,30 90,70 50,94 10,70 20,30" fill="none" stroke="currentColor" strokeWidth="7"/>
      <polygon points="50,25 68,42 72,68 50,80 28,68 32,42"/>
    </svg>
  ),
  github: (
    <svg width="13" height="13" viewBox="0 0 100 100" fill="currentColor">
      <path d="M50 5C25.1 5 5 25.1 5 50c0 19.9 12.9 36.8 30.8 42.8 2.3.4 3.1-1 3.1-2.2v-7.7c-12.6 2.7-15.3-6.1-15.3-6.1-2.1-5.3-5.1-6.7-5.1-6.7-4.1-2.8.3-2.8.3-2.8 4.6.3 7 4.7 7 4.7 4.1 7 10.7 5 13.3 3.8.4-2.9 1.6-5 2.9-6.1-10.1-1.1-20.6-5-20.6-22.4 0-5 1.8-9 4.7-12.2-.5-1.2-2-5.7.4-11.9 0 0 3.8-1.2 12.5 4.7 3.6-1 7.5-1.5 11.4-1.5s7.8.5 11.4 1.5c8.7-5.9 12.5-4.7 12.5-4.7 2.5 6.2.9 10.7.4 11.9 2.9 3.2 4.7 7.2 4.7 12.2 0 17.4-10.6 21.2-20.7 22.3 1.6 1.4 3.1 4.2 3.1 8.5v12.6c0 1.2.8 2.7 3.1 2.2C82.1 86.8 95 69.9 95 50 95 25.1 74.9 5 50 5z"/>
    </svg>
  ),
  gdocs: (
    <svg width="13" height="13" viewBox="0 0 100 100" fill="currentColor">
      <rect x="18" y="5" width="50" height="90" rx="4" fill="none" stroke="currentColor" strokeWidth="7"/>
      <path d="M68 5l14 14H68z" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
      <line x1="30" y1="38" x2="70" y2="38" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <line x1="30" y1="53" x2="70" y2="53" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
      <line x1="30" y1="68" x2="55" y2="68" stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  ),
  linear: (
    <svg width="13" height="13" viewBox="0 0 100 100" fill="currentColor">
      <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor" strokeWidth="8"/>
      <path d="M26 74L74 26M50 26L74 50M26 50L50 74" stroke="currentColor" strokeWidth="7" strokeLinecap="round"/>
    </svg>
  ),
};

// ─── MCP sources section ──────────────────────────────────────────────────────

const MCP_PLATFORMS = [
  { id: 'notion',   label: 'Notion' },
  { id: 'obsidian', label: 'Obsidian' },
  { id: 'github',   label: 'GitHub' },
  { id: 'gdocs',    label: 'Google Docs' },
  { id: 'linear',   label: 'Linear' },
];

function McpSources() {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div style={{ borderTop: '1px solid rgba(232,232,240,0.05)', paddingTop: '1.5rem' }}>
      <span
        style={{
          display: 'block',
          color: 'rgba(232,232,240,0.2)',
          fontSize: 9,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: '0.75rem',
        }}
      >
        — or connect a source via MCP
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {MCP_PLATFORMS.map(p => (
          <button
            key={p.id}
            onMouseEnter={() => setHovered(p.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              background: 'transparent',
              border: '1px solid',
              borderColor: hovered === p.id ? 'rgba(232,232,240,0.22)' : 'rgba(232,232,240,0.08)',
              color: hovered === p.id ? 'rgba(232,232,240,0.7)' : 'rgba(232,232,240,0.3)',
              fontSize: 9,
              letterSpacing: '0.1em',
              fontFamily: 'system-ui, sans-serif',
              padding: '5px 10px',
              cursor: 'not-allowed',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
            title="MCP connector — configure in settings"
          >
            {logos[p.id]}
            {p.label}
          </button>
        ))}
        <button
          style={{
            background: 'transparent',
            border: '1px dashed rgba(232,232,240,0.07)',
            color: 'rgba(232,232,240,0.2)',
            fontSize: 9,
            fontFamily: 'system-ui, sans-serif',
            fontStyle: 'italic',
            padding: '5px 10px',
            cursor: 'not-allowed',
          }}
          title="Any MCP-compatible server"
        >
          + any MCP server
        </button>
      </div>
      <span
        style={{
          display: 'block',
          marginTop: '0.5rem',
          color: 'rgba(232,232,240,0.1)',
          fontSize: 9,
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
        }}
      >
        connect via Model Context Protocol to pull from your tools directly
      </span>
    </div>
  );
}
