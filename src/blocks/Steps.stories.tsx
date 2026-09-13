import type { Meta, StoryObj } from '@storybook/react-vite';
import { Steps } from './Steps';
import { stepsBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/steps',
  component: Steps,
  tags: ['autodocs'],
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: stepsBlock } };

/** An odd number of steps must not leave a hole in the two-column grid. */
export const OddCount: Story = {
  args: {
    block: { ...stepsBlock, props: { ...stepsBlock.props, steps: stepsBlock.props.steps.slice(0, 3) } },
  },
};
