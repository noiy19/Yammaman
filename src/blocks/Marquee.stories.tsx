import type { Meta, StoryObj } from '@storybook/react-vite';
import { Marquee } from './Marquee';
import { marqueeBlock, marqueeTwoTilesBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/marquee',
  component: Marquee,
  tags: ['autodocs'],
} satisfies Meta<typeof Marquee>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: marqueeBlock } };

/**
 * The schema minimum: two tiles, no label. Worth a story of its own because a
 * two-tile strip is where the loop is most obvious — with a short list the
 * second copy is on screen at the same time as the first, so any error in the
 * seam arithmetic is plain rather than hidden behind a full row of tiles.
 */
export const MinimumTiles: Story = { args: { block: marqueeTwoTilesBlock } };
