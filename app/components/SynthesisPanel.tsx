'use client';

import { SynthesisData } from '../lib/demo-script';

interface SessionStats {
  questionsAnswered: number;
  nodeCount: number;
  edgeCount: number;
  wordCount: number;
}

interface SynthesisPanelProps {
  data: SynthesisData;
  isDemo: boolean;
  stats: SessionStats;
  onExport: () => void;
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

export default function SynthesisPanel({ data, stats, onExport }: SynthesisPanelProps) {
  const statItems = [
    { label: 'questions\nanswered', value: stats.questionsAnswered },
    { label: 'nodes', value: stats.nodeCount },
    { label: 'connections', value: stats.edgeCount },
    { label: 'words\nwritten', value: stats.wordCount },
  ];

  return (
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

        {/* Session stats */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid rgba(232,232,240,0.07)', paddingTop: '1.5rem' }}>
          <span
            style={{
              color: 'rgba(232,232,240,0.2)',
              fontSize: 9,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              fontFamily: 'system-ui, sans-serif',
              display: 'block',
              marginBottom: '1rem',
            }}
          >
            Stats about your conversation
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            {statItems.map(({ label, value }) => (
              <div
                key={label}
                style={{
                  background: 'rgba(232,232,240,0.03)',
                  border: '1px solid rgba(232,232,240,0.06)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.35rem',
                }}
              >
                <span style={{ color: 'rgba(232,232,240,0.85)', fontSize: '1.7rem', fontFamily: 'Georgia, serif', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {value}
                </span>
                <span style={{ color: 'rgba(232,232,240,0.28)', fontSize: 8, fontFamily: 'system-ui, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', whiteSpace: 'pre-line' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export button */}
      <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid rgba(232,232,240,0.07)', flexShrink: 0 }}>
        <button
          onClick={onExport}
          style={{
            width: '100%',
            color: 'rgba(232,232,240,0.5)',
            background: 'none',
            border: '1px solid rgba(232,232,240,0.12)',
            fontSize: 9,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            fontFamily: 'system-ui, sans-serif',
            padding: '10px',
            cursor: 'pointer',
          }}
        >
          export →
        </button>
      </div>
    </div>
  );
}
