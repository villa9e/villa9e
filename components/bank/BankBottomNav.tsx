'use client';

// BankBottomNav is disabled per platform spec.
// The global teepee radial menu handles all top-level navigation.
// This component intentionally returns null to avoid a duplicate nav bar
// while preserving imports in Bank sub-pages that reference it.

export function BankBottomNav({ active }: { active: string }) {
  return null;
}
