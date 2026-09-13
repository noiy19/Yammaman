import type { Meta, StoryObj } from '@storybook/react-vite';
import { CallToAction } from './CallToAction';
import {
  callToActionBlock,
  callToActionInvertedBlock,
} from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/callToAction',
  component: CallToAction,
  tags: ['autodocs'],
} satisfies Meta<typeof CallToAction>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = { args: { block: callToActionBlock } };

/**
 * Inverted is the one dark band on a light page. Both tones are stories because
 * the contrast between the button and its background is the thing most likely
 * to break when the brand kit changes — and it is the reason the tone prop
 * drives the Section and the button together rather than each deciding alone.
 */
export const Inverted: Story = { args: { block: callToActionInvertedBlock } };
