'use client';

import { useEffect } from 'react';

export interface HistoryEntry {
  id: string;
  question?: string;
  response?: string;
  nodeLabels?: string[];
  edgeDesc?: string;
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onClose: () => void;
  onHighlightNodes: (nodeIds: string[]) => void;
}

const LABEL_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: 'rgba(232,232,240,0.25)',
};

function truncate(s: string, n = 80) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function HistoryPanel({ entries, onClose, onHighlightNodes }: HistoryPanelProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const reversed = [...entries].reverse();

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 280,
        background: 'rgba(13,13,15,0.95)',
        borderRight: '1px solid rgba(232,232,240,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 0 24px',
        animation: 'slide-in-left 400ms ease both',
        zIndex: 10,
        overflowY: 'auto',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px 20px' }}>
        <span style={{ ...LABEL_STYLE, color: 'rgba(232,232,240,0.35)' }}>history</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(232,232,240,0.25)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          close
        </button>
      </div>

      {reversed.length === 0 && (
        <p style={{
          padding: '0 20px',
          color: 'rgba(232,232,240,0.2)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: '0.8rem',
          lineHeight: 1.6,
        }}>
          No events yet.
        </p>
      )}

      {reversed.map(entry => (
        <div
          key={entry.id}
          style={{
            padding: '12px 20px',
            borderBottom: '1px solid rgba(232,232,240,0.04)',
            cursor: entry.nodeLabels?.length ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (entry.nodeLabels?.length) {
              onHighlightNodes(entry.nodeLabels);
            }
          }}
        >
          {entry.question && (
            <p style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '0.775rem',
              lineHeight: 1.55,
              color: 'rgba(232,232,240,0.45)',
              margin: '0 0 6px',
            }}>
              {truncate(entry.question, 80)}
            </p>
          )}
          {entry.response && (
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              color: 'rgba(232,232,240,0.25)',
              margin: '0 0 6px',
            }}>
              "{truncate(entry.response, 80)}"
            </p>
          )}
          {entry.nodeLabels && entry.nodeLabels.length > 0 && (
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              color: 'rgba(232,232,240,0.2)',
              margin: 0,
            }}>
              → {entry.nodeLabels.map(l => `intuited: ${l}`).join(', ')}
            </p>
          )}
          {entry.edgeDesc && (
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.7rem',
              letterSpacing: '0.05em',
              color: 'rgba(232,232,240,0.2)',
              margin: entry.nodeLabels?.length ? '4px 0 0' : 0,
            }}>
              → {entry.edgeDesc}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
