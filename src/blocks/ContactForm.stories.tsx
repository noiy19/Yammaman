import type { Meta, StoryObj } from '@storybook/react-vite';
import { ContactForm } from './ContactForm';
import { contactFormBlock } from './__fixtures__/storyFixtures';

const meta = {
  title: 'Blocks/contactForm',
  component: ContactForm,
  tags: ['autodocs'],
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Note the deliberately DISABLED submit and its visible explanation. A form
 * that appears to accept a message it cannot deliver is the worst failure mode
 * on a storefront, so the not-wired state is the state this story documents.
 */
export const NotWired: Story = { args: { block: contactFormBlock } };
