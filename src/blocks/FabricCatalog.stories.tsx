import type { Meta, StoryObj } from '@storybook/react-vite';
import { FabricCatalog } from './FabricCatalog';
import { fabricCatalogBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/fabricCatalog',
  component: FabricCatalog,
  tags: ['autodocs'],
} satisfies Meta<typeof FabricCatalog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * FR-2 states are all present in the fixture: in-stock, made-to-order (out of
 * stock but weavable), and unavailable. The made-to-order case is the one that
 * matters — it must read as still-buyable, not as sold out.
 */
export const Default: Story = { args: { block: fabricCatalogBlock } };

/** Availability hidden — the client's choice, but the fabric never disappears. */
export const AvailabilityHidden: Story = {
  args: {
    block: {
      ...fabricCatalogBlock,
      props: { ...fabricCatalogBlock.props, showAvailability: false },
    },
  },
};
