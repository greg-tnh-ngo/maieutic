// Server-side only — reads process.env directly
export function isLiveMode(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  // Real Anthropic keys start with sk-ant-
  return !!(key && key.startsWith('sk-ant-'));
}

export function isDemoMode(): boolean {
  return !isLiveMode();
}
