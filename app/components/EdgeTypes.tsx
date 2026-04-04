'use client';

import { memo, useState, useEffect, useRef } from 'react';
import {
  EdgeProps,
  getStraightPath,
  EdgeLabelRenderer,
} from 'reactflow';

/**
 * AnimatedEdge: shows "cogitating…" for 1.2s then draws the edge in over 600ms.
 * Used for edges that have data.createdAt within the last 5 seconds.
 */
const AnimatedEdge = memo(function AnimatedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [phase, setPhase] = useState<'cogitating' | 'drawing' | 'done'>('cogitating');
  const pathRef = useRef<SVGPathElement>(null);

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });

  useEffect(() => {
    const cogTid = setTimeout(() => {
      setPhase('drawing');
      // After draw animation completes
      const drawTid = setTimeout(() => setPhase('done'), 650);
      return () => clearTimeout(drawTid);
    }, 1200);
    return () => clearTimeout(cogTid);
  }, []);

  // Stroke-dashoffset draw animation
  useEffect(() => {
    if (phase !== 'drawing' || !pathRef.current) return;
    const len = pathRef.current.getTotalLength();
    const el = pathRef.current;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    // Trigger reflow then animate
    void el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 600ms ease';
    el.style.strokeDashoffset = '0';
    return () => {
      el.style.transition = '';
      el.style.strokeDasharray = '';
      el.style.strokeDashoffset = '';
    };
  }, [phase]);

  // Override dasharray when done (restore edge's own style)
  const strokeDasharray = phase === 'done'
    ? (style?.strokeDasharray as string | undefined)
    : undefined;

  return (
    <>
      <path
        ref={pathRef}
        id={id}
        d={edgePath}
        fill="none"
        style={{
          ...style,
          strokeDasharray: phase === 'drawing' ? undefined : strokeDasharray,
          opacity: phase === 'cogitating' ? 0 : 1,
          transition: phase === 'drawing' ? undefined : 'opacity 200ms',
        }}
        markerEnd={markerEnd}
      />
      {phase === 'cogitating' && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'none',
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: 10,
              color: 'rgba(232,232,240,0.35)',
              letterSpacing: '0.05em',
              animation: 'fade-in 300ms ease',
            }}
            className="nodrag nopan"
          >
            cogitating…
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const edgeTypes = {
  animated: AnimatedEdge,
};
