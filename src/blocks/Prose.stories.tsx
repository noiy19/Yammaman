import type { Meta, StoryObj } from '@storybook/react-vite';
import { Prose } from './Prose';
import { proseBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/prose',
  component: Prose,
  tags: ['autodocs'],
} satisfies Meta<typeof Prose>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeading: Story = { args: { block: proseBlock } };

/** Tone `lead` is the larger introductory setting. */
export const Lead: Story = {
  args: { block: { ...proseBlock, props: { ...proseBlock.props, tone: 'lead' } } },
};

/** No heading — the schema allows it, and the top margin must not appear. */
export const NoHeading: Story = {
  args: {
    block: {
      ...proseBlock,
      props: { body: proseBlock.props.body, tone: 'body' },
    },
  },
};
