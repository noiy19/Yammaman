import type { Meta, StoryObj } from '@storybook/react-vite';
import { Faq } from './Faq';
import { faqBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/faq',
  component: Faq,
  tags: ['autodocs'],
} satisfies Meta<typeof Faq>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: faqBlock } };

/** A single item — the schema's minimum. */
export const SingleItem: Story = {
  args: { block: { ...faqBlock, props: { ...faqBlock.props, items: faqBlock.props.items.slice(0, 1) } } },
};
