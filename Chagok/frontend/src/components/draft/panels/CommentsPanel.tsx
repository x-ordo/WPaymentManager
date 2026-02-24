import type { ComponentProps } from 'react';
import CommentsSection from '../sections/CommentsSection';

export function CommentsPanel(props: ComponentProps<typeof CommentsSection>) {
  return <CommentsSection {...props} />;
}
