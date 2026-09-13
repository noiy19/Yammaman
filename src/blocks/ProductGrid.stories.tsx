import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductGrid } from './ProductGrid';
import { productGridBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/productGrid',
  component: ProductGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof ProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** In-stock slice, 3 columns. */
export const InStock: Story = { args: { block: productGridBlock } };

/** Made-to-order slice — prices render as deposit + balance. */
export const MadeToOrder: Story = {
  args: {
    block: {
      ...productGridBlock,
      props: { ...productGridBlock.props, source: 'made-to-order', heading: 'Made to order' },
    },
  },
};

/** 2 columns, at the schema's minimum. */
export const TwoColumns: Story = {
  args: {
    block: { ...productGridBlock, props: { ...productGridBlock.props, columns: 2 } },
  },
};
