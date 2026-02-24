import type { ComponentProps } from 'react';
import { SaveStatusIndicator as BaseSaveStatusIndicator } from '../SaveStatusIndicator';

export function SaveStatusIndicator(props: ComponentProps<typeof BaseSaveStatusIndicator>) {
  return <BaseSaveStatusIndicator {...props} />;
}
