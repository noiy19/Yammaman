import type { Meta, StoryObj } from '@storybook/react-vite';
import { SectionHeading } from './SectionHeading';
import { sectionHeadingBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/sectionHeading',
  component: SectionHeading,
  tags: ['autodocs'],
} satisfies Meta<typeof SectionHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { block: sectionHeadingBlock } };

/** With the optional eyebrow and standfirst. */
export const WithEyebrow: Story = {
  args: {
    block: {
      ...sectionHeadingBlock,
      props: {
        eyebrow: 'The process',
        heading: sectionHeadingBlock.props.heading,
        intro: 'Four months, one garment, and a mill that has to agree to weave it.',
      },
    },
  },
};

/** Heading alone — the shape the section ships in until its design is settled. */
export const HeadingOnly: Story = {
  args: { block: { ...sectionHeadingBlock, props: { heading: 'How it works' } } },
};
