import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hero } from './Hero';
import { heroBlock, heroMinimalBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/hero',
  component: Hero,
  tags: ['autodocs'],
} satisfies Meta<typeof Hero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: heroBlock } };

/** Heading only — the minimum the content schema permits. */
export const Minimal: Story = { args: { block: heroMinimalBlock } };
