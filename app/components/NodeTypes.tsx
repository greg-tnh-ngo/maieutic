'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Handles positioned at the visual circle center: 6px top-padding + 7px half-circle = 13px from top
const CenterHandles = () => (
  <>
    <Handle
      type="target"
      position={Position.Top}
      style={{ top: 13, transform: 'translate(-50%, -50%)', opacity: 0, pointerEvents: 'none' }}
    />
    <Handle
      type="source"
      position={Position.Top}
      style={{ top: 13, transform: 'translate(-50%, -50%)', opacity: 0, pointerEvents: 'none' }}
    />
  </>
);

export const ConceptNode = memo(({ data }: NodeProps) => (
  <div>
    <CenterHandles />
    <div className="node-inner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      padding: '6px 12px',
      minWidth: 60,
      minHeight: 40,
    }}>
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
  </div>
));
ConceptNode.displayName = 'ConceptNode';

export const TensionNode = memo(({ data }: NodeProps) => (
  <div>
    <CenterHandles />
    <div className="node-inner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      padding: '6px 12px',
      minWidth: 60,
      minHeight: 40,
    }}>
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
    </div>
  </div>
));
TensionNode.displayName = 'TensionNode';

export const GhostNode = memo(({ data }: NodeProps) => (
  // note: .node-ghost class triggers ghost-pulse animation and delayed node-appear
  <div className="node-ghost">
    <CenterHandles />
    <div className="node-inner" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 5,
      padding: '6px 12px',
      minWidth: 60,
      minHeight: 40,
      cursor: 'pointer',
    }}>
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
    </div>
  </div>
));
GhostNode.displayName = 'GhostNode';

export const nodeTypes = {
  concept: ConceptNode,
  tension: TensionNode,
  ghost:   GhostNode,
};
