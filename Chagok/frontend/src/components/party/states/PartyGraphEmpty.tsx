import type { ComponentProps } from 'react';
import { PartyEmptyState } from '../PartyEmptyState';

export function PartyGraphEmpty(props: ComponentProps<typeof PartyEmptyState>) {
  return <PartyEmptyState {...props} />;
}
