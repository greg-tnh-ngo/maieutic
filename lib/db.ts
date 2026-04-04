import { Node, Edge } from 'reactflow';
import { supabase } from './supabase';

type NodeData = { label: string; nodeKind: string; opacity: number };
type EdgeData = { edgeKind: string };

export async function createProject(title: string): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ title })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function createSession(projectId: string): Promise<string> {
  const { data, error } = await supabase
    .from('sessions')
    .insert({ project_id: projectId, transcript: [] })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

export async function saveTranscript(sessionId: string, transcript: unknown[]): Promise<void> {
  const { error } = await supabase
    .from('sessions')
    .update({ transcript })
    .eq('id', sessionId);
  if (error) throw error;
}

export async function saveNodes(projectId: string, nodes: Node[]): Promise<void> {
  if (nodes.length === 0) return;
  const rows = nodes.map(n => {
    const d = n.data as NodeData;
    return {
      project_id: projectId,
      label: d.label,
      node_kind: d.nodeKind,
      opacity: d.opacity,
      position_x: n.position.x,
      position_y: n.position.y,
    };
  });
  const { error } = await supabase
    .from('terrain_nodes')
    .upsert(rows, { onConflict: 'project_id,label' });
  if (error) throw error;
}

export async function saveEdges(projectId: string, edges: Edge[]): Promise<void> {
  if (edges.length === 0) return;
  const rows = edges.map(e => {
    const d = (e.data ?? {}) as Partial<EdgeData>;
    return {
      project_id: projectId,
      source_id: e.source,
      target_id: e.target,
      edge_kind: d.edgeKind ?? 'solid',
    };
  });
  const { error } = await supabase
    .from('terrain_edges')
    .upsert(rows, { onConflict: 'project_id,source_id,target_id' });
  if (error) throw error;
}

export async function loadProject(projectId: string): Promise<{
  nodes: Array<{ label: string; node_kind: string; opacity: number; position_x: number; position_y: number }>;
  edges: Array<{ source_id: string; target_id: string; edge_kind: string }>;
}> {
  const [nodesRes, edgesRes] = await Promise.all([
    supabase.from('terrain_nodes').select('label, node_kind, opacity, position_x, position_y').eq('project_id', projectId),
    supabase.from('terrain_edges').select('source_id, target_id, edge_kind').eq('project_id', projectId),
  ]);
  if (nodesRes.error) throw nodesRes.error;
  if (edgesRes.error) throw edgesRes.error;
  return {
    nodes: nodesRes.data ?? [],
    edges: edgesRes.data ?? [],
  };
}
