import type { ComponentProps } from 'react';
import PrecedentSection from '../sections/PrecedentSection';

export function PrecedentCitationsPanel(props: ComponentProps<typeof PrecedentSection>) {
  return <PrecedentSection {...props} />;
}
