import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from './EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Shared/EmptyState',
  component: EmptyState,
  args: {
    title: 'Nothing here yet',
    description: 'Try creating your first item to get started.',
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    primaryAction: {
      label: 'Create item',
      onClick: () => {},
    },
    secondaryAction: {
      label: 'Learn more',
      onClick: () => {},
    },
  },
};
