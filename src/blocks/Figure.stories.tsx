import type { Meta, StoryObj } from '@storybook/react-vite';
import { Figure } from './Figure';
import { figureBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/figure',
  component: Figure,
  tags: ['autodocs'],
} satisfies Meta<typeof Figure>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithCaption: Story = { args: { block: figureBlock } };

/** No caption — must not leave a dangling margin. */
export const NoCaption: Story = {
  args: { block: { ...figureBlock, props: { image: figureBlock.props.image } } },
};
