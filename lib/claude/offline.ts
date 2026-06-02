// Shared Spirit/Claude offline detection utility.
// When Anthropic API has no credits, all AI features degrade gracefully.

export function isCreditsError(err: any): boolean {
  const msg = err?.message ?? err?.error?.message ?? '';
  const type = err?.error?.type ?? '';
  return (
    (err?.status === 400 && msg.toLowerCase().includes('credit')) ||
    (type === 'invalid_request_error' && msg.toLowerCase().includes('credit'))
  );
}

export function spiritOfflineMessage(): string {
  return "Spirit is resting right now — AI features will be back shortly. In the meantime, you can browse Goal DNA templates, use the Workshop feed, and manage your goals manually.";
}

export function gpsOfflineMessage(): string {
  return "The GPS engine is temporarily offline. Your existing plan is still active — check your current sprint and keep moving.";
}
