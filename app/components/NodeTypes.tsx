'use client';

import { memo, useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const InvisibleHandles = () => (
  <>
    <Handle type="target" position={Position.Top}    style={{ opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Bottom} style={{ opacity: 0, pointerEvents: 'none' }} />
    <Handle type="target" position={Position.Left}   style={{ opacity: 0, pointerEvents: 'none' }} />
    <Handle type="source" position={Position.Right}  style={{ opacity: 0, pointerEvents: 'none' }} />
  </>
);

export const ConceptNode = memo(({ data }: NodeProps) => (
  <div style={{
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    minWidth: 60,
    minHeight: 40,
  }}>
    <InvisibleHandles />
    <div style={{
      width: 14,
      height: 14,
      borderRadius: '50%',
      background: '#e8e8f0',
      flexShrink: 0,
    }} />
    <span style={{
      color: 'rgba(232,232,240,0.92)',
      fontSize: 10,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      fontFamily: 'system-ui, sans-serif',
      whiteSpace: 'nowrap',
      userSelect: 'none',
      fontWeight: 500,
    }}>
      {data.label}
    </span>
  </div>
));
ConceptNode.displayName = 'ConceptNode';

export const TensionNode = memo(({ data }: NodeProps) => {
  const [note, setNote] = useState('');
  const [open, setOpen] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        minWidth: 60,
        minHeight: 40,
      }}
      onDoubleClick={e => { e.stopPropagation(); setOpen(true); setTimeout(() => taRef.current?.focus(), 30); }}
    >
      <InvisibleHandles />
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'rgba(139,32,32,0.2)',
        border: '1.5px solid #c03030',
        flexShrink: 0,
      }} />
      <span style={{
        color: '#c03030',
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontWeight: 500,
      }}>
        {data.label}
      </span>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginTop: 8,
            zIndex: 1000,
            background: '#0d0d0f',
            border: '1px solid rgba(139,32,32,0.4)',
            padding: '8px 10px',
            width: 200,
          }}
          onMouseDown={e => e.stopPropagation()}
        >
          <textarea
            ref={taRef}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="what is this tension about?"
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: 'rgba(232,232,240,0.7)',
              fontSize: 10,
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              lineHeight: 1.6,
              resize: 'none',
              outline: 'none',
              caretColor: '#8b2020',
            }}
          />
          <button
            onClick={() => setOpen(false)}
            style={{
              marginTop: 4,
              color: 'rgba(139,32,32,0.6)',
              background: 'none',
              border: 'none',
              fontSize: 9,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            close
          </button>
        </div>
      )}
    </div>
  );
});
TensionNode.displayName = 'TensionNode';

export const GhostNode = memo(({ data }: NodeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        minWidth: 60,
        minHeight: 40,
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <InvisibleHandles />
      <div style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'rgba(58,58,106,0.35)',
        border: '1.5px dashed #6060a8',
        flexShrink: 0,
      }} />
      <span style={{
        color: 'rgba(232,232,240,0.75)',
        fontSize: 10,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        fontWeight: 400,
        fontStyle: 'italic',
      }}>
        {data.label}
      </span>
      {showTooltip && data.note && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: 8,
          background: 'rgba(13,13,15,0.95)',
          border: '1px solid rgba(58,58,106,0.5)',
          padding: '8px 12px',
          maxWidth: 200,
          fontSize: 10,
          lineHeight: 1.6,
          color: 'rgba(232,232,240,0.6)',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          whiteSpace: 'normal',
          zIndex: 1000,
          pointerEvents: 'none',
        }}>
          {data.note}
        </div>
      )}
    </div>
  );
});
GhostNode.displayName = 'GhostNode';

export const AbsenceNode = memo(({ data }: NodeProps) => (
  <div style={{
    position: 'relative',
    border: '1px dashed rgba(232,232,240,0.12)',
    background: 'rgba(232,232,240,0.02)',
    padding: '14px 20px',
    minWidth: 100,
    minHeight: 40,
    textAlign: 'center',
  }}>
    <InvisibleHandles />
    <span style={{
      color: 'rgba(232,232,240,0.3)',
      fontSize: 10,
      letterSpacing: '0.1em',
      fontStyle: 'italic',
      fontFamily: 'Georgia, serif',
      userSelect: 'none',
    }}>
      {data.label}
    </span>
  </div>
));
AbsenceNode.displayName = 'AbsenceNode';

export const nodeTypes = {
  concept: ConceptNode,
  tension: TensionNode,
  ghost:   GhostNode,
  absence: AbsenceNode,
};