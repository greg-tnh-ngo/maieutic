import type { Node } from 'reactflow';

const MIN_DIST = 160;
const ITERATIONS = 60;

/**
 * Spread nodes apart using iterative repulsion.
 * Prevents labels overlapping when positions are clustered.
 */
export function spreadNodes(nodes: Node[]): Node[] {
  if (nodes.length <= 1) return nodes;

  const result = nodes.map(n => ({
    ...n,
    position: { x: n.position.x, y: n.position.y },
  }));

  for (let iter = 0; iter < ITERATIONS; iter++) {
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i].position;
        const b = result[j].position;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.001;
        if (dist < MIN_DIST) {
          const push = (MIN_DIST - dist) / 2 + 1;
          const nx = (dx / dist) * push;
          const ny = (dy / dist) * push;
          result[i] = { ...result[i], position: { x: a.x - nx, y: a.y - ny } };
          result[j] = { ...result[j], position: { x: b.x + nx, y: b.y + ny } };
        }
      }
    }
  }

  return result;
}

/**
 * Place a single new node away from existing nodes.
 * Returns a position that doesn't collide with any current node.
 */
export function findFreePosition(
  existing: Node[],
  hint: { x: number; y: number } = { x: 300, y: 300 }
): { x: number; y: number } {
  if (existing.length === 0) return hint;

  let pos = { ...hint };
  for (let attempt = 0; attempt < 20; attempt++) {
    const tooClose = existing.some(n => Math.hypot(n.position.x - pos.x, n.position.y - pos.y) < MIN_DIST);
    if (!tooClose) return pos;
    // Spiral outward
    const angle = attempt * 2.4;
    const radius = MIN_DIST * (1 + attempt * 0.3);
    pos = { x: hint.x + Math.cos(angle) * radius, y: hint.y + Math.sin(angle) * radius };
  }
  return pos;
}
