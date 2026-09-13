import type { Meta, StoryObj } from '@storybook/react-vite';
import { Stores } from './Stores';
import { storesBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/stores',
  component: Stores,
  tags: ['autodocs'],
} satisfies Meta<typeof Stores>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Two stores: one with every optional field, one with only the required ones. */
export const Default: Story = { args: { block: storesBlock } };
