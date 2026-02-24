import type { ComponentProps } from 'react';
import ChangeLogSection from '../sections/ChangeLogSection';

export function ChangeLogPanel(props: ComponentProps<typeof ChangeLogSection>) {
  return <ChangeLogSection {...props} />;
}
