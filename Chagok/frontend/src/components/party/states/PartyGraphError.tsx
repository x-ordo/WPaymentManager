import type { ComponentProps } from 'react';
import { PartyErrorState } from '../PartyErrorState';

export function PartyGraphError(props: ComponentProps<typeof PartyErrorState>) {
  return <PartyErrorState {...props} />;
}
