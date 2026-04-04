'use client';

import { useState, useEffect, useRef } from 'react';
import { Node } from 'reactflow';

interface NodeDetailPaneProps {
  node: Node | null;
  isDemo: boolean;
  isAnimating?: boolean;
  onClose: () => void;
  onDeleteNode: (id: string) => void;
  onUpdateLabel: (id: string, label: string) => void;
  onGhostSubmit?: (nodeId: string, response: string) => void;
  /** Demo scripted response to pre-fill after 600ms delay */
  demoGhostResponse?: string;
}

const LABEL_STYLE = {
  fontFamily: 'system-ui, sans-serif',
  fontSize: 9,
  letterSpacing: '0.15em',
  textTransform: 'uppercase' as const,
  color: 'rgba(232,232,240,0.35)',
};

const TYPE_COLORS: Record<string, string> = {
  concept:  'rgba(232,232,240,0.5)',
  tension:  'rgba(192,48,48,0.7)',
  ghost:    'rgba(96,96,168,0.7)',
};

export default function NodeDetailPane({
  node,
  isDemo,
  isAnimating,
  onClose,
  onDeleteNode,
  onUpdateLabel,
  onGhostSubmit,
  demoGhostResponse,
}: NodeDetailPaneProps) {
  const [editLabel, setEditLabel] = useState('');
  const [ghostResponse, setGhostResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (node) {
      setEditLabel(node.data.label ?? '');
      setGhostResponse('');
      setSubmitted(false);
    }
  }, [node?.id]);

  // Demo: pre-fill ghost response after 600ms
  useEffect(() => {
    if (!node || node.type !== 'ghost' || !isDemo || !demoGhostResponse) return;
    const tid = setTimeout(() => setGhostResponse(demoGhostResponse), 600);
    return () => clearTimeout(tid);
  }, [node?.id, isDemo, demoGhostResponse]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!node) return null;

  const isGhost = node.type === 'ghost';
  const typeName = node.type ?? 'concept';
  const typeColor = TYPE_COLORS[typeName] ?? TYPE_COLORS.concept;

  const handleLabelBlur = () => {
    if (editLabel.trim() && editLabel.trim() !== node.data.label) {
      onUpdateLabel(node.id, editLabel.trim());
    }
  };

  const handleGhostSubmit = () => {
    if (!ghostResponse.trim()) return;
    setSubmitted(true);
    onGhostSubmit?.(node.id, ghostResponse.trim());
  };

  return (
    <div
      ref={paneRef}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: 320,
        background: '#0d0d0f',
        borderLeft: '1px solid rgba(232,232,240,0.06)',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 24px 24px',
        animation: 'slide-in-right 400ms ease both',
        zIndex: 10,
        overflowY: 'auto',
      }}
    >
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
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

      {/* Type badge */}
      <div style={{ marginBottom: 20 }}>
        <span style={{
          ...LABEL_STYLE,
          color: typeColor,
          borderBottom: `1px solid ${typeColor}`,
          paddingBottom: 2,
        }}>
          {typeName}
        </span>
      </div>

      {/* Label */}
      {!isGhost ? (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>label</div>
          <input
            value={editLabel}
            onChange={e => setEditLabel(e.target.value)}
            onBlur={handleLabelBlur}
            onKeyDown={e => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(232,232,240,0.1)',
              color: '#e8e8f0',
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.875rem',
              letterSpacing: '0.06em',
              padding: '4px 0',
              outline: 'none',
            }}
          />
        </div>
      ) : (
        <div style={{ marginBottom: 24 }}>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '1rem',
            lineHeight: 1.75,
            color: '#e8e8f0',
            margin: 0,
          }}>
            {node.data.label}
          </p>
        </div>
      )}

      {/* Ghost node: note + response */}
      {isGhost && node.data.note && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>why it appeared</div>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.825rem',
            lineHeight: 1.65,
            color: 'rgba(232,232,240,0.55)',
            margin: 0,
          }}>
            {node.data.note}
          </p>
        </div>
      )}

      {/* Non-ghost: reason */}
      {!isGhost && node.data.reason && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>why it appeared</div>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontStyle: 'italic',
            fontSize: '0.825rem',
            lineHeight: 1.65,
            color: 'rgba(232,232,240,0.55)',
            margin: 0,
          }}>
            {node.data.reason}
          </p>
        </div>
      )}

      {/* Origin question + response */}
      {!isGhost && node.data.originQuestion && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>prompted by</div>
          <p style={{
            fontFamily: 'Georgia, serif',
            fontSize: '0.825rem',
            lineHeight: 1.65,
            color: 'rgba(232,232,240,0.4)',
            margin: '0 0 8px',
            fontStyle: 'italic',
          }}>
            {node.data.originQuestion}
          </p>
          {node.data.originResponse && (
            <p style={{
              fontFamily: 'system-ui, sans-serif',
              fontSize: '0.8rem',
              lineHeight: 1.6,
              color: 'rgba(232,232,240,0.3)',
              margin: 0,
            }}>
              "{(node.data.originResponse as string).slice(0, 120)}{(node.data.originResponse as string).length > 120 ? '…' : ''}"
            </p>
          )}
        </div>
      )}

      {/* Ghost node: response textarea */}
      {isGhost && !submitted && (
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div style={{ ...LABEL_STYLE, marginBottom: 8 }}>your response</div>
          <textarea
            value={ghostResponse}
            onChange={e => setGhostResponse(e.target.value)}
            placeholder="explore this…"
            rows={4}
            disabled={submitted}
            onKeyDown={e => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                handleGhostSubmit();
              }
            }}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid rgba(232,232,240,0.1)',
              color: '#e8e8f0',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '0.825rem',
              lineHeight: 1.65,
              resize: 'none',
              outline: 'none',
              caretColor: '#e8e8f0',
              paddingBottom: '0.5rem',
            }}
          />
          <button
            onClick={handleGhostSubmit}
            disabled={!ghostResponse.trim() || submitted}
            style={{
              marginTop: 12,
              background: 'none',
              border: '1px solid rgba(232,232,240,0.12)',
              color: ghostResponse.trim() ? 'rgba(232,232,240,0.5)' : 'rgba(232,232,240,0.15)',
              fontFamily: 'system-ui, sans-serif',
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '6px 14px',
              cursor: ghostResponse.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            ⌘↵
          </button>
        </div>
      )}

      {/* Spacer to push delete to bottom for non-ghost */}
      {!isGhost && <div style={{ flex: 1 }} />}

      {/* Delete (non-ghost only) */}
      {!isGhost && (
        <button
          onClick={() => { onDeleteNode(node.id); onClose(); }}
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            color: 'rgba(139,32,32,0.5)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            padding: 0,
            marginTop: 24,
          }}
        >
          — remove
        </button>
      )}
    </div>
  );
}
