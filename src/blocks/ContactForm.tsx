import { useId } from 'react';
import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * ContactForm — FR-5's entry point (submission → ticket → Nana by email, worker
 * by Line).
 *
 * NOT WIRED, AND IT SAYS SO. The ticket API, the mailbox, and the Line
 * notification are all open items. A form that appears to submit and silently
 * drops the message is the single worst failure mode on a storefront — the
 * customer believes they have made contact and never follows up. So the fields
 * are real and the submit path is explicitly disabled with a visible reason.
 *
 * When the ticket endpoint lands, the change here is small: wire onSubmit, swap
 * the disabled button for a busy/idle pair, and show the returned ticket id.
 * The markup and the accessibility wiring below do not change.
 */
export function ContactForm({ block }: { block: BlockOf<'contactForm'> }) {
  const { heading, intro, channels } = block.props;
  const headingId = `${block.id}-heading`;
  const noteId = useId();

  return (
    <Section labelledBy={headingId} tone="raised">
      <Container>
        <h2 id={headingId} className="font-display text-ink text-2xl md:text-3xl">
          {heading}
        </h2>
        {intro ? <p className="text-ink-secondary measure mt-4">{intro}</p> : null}

        <div className="measure mt-8">
          <form
            aria-describedby={noteId}
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id={`${block.id}-name`} label="Name" autoComplete="name" />
              <Field
                id={`${block.id}-email`}
                label="Email"
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="mt-4">
              <label
                htmlFor={`${block.id}-message`}
                className="text-ink block text-sm font-medium"
              >
                Message
              </label>
              <textarea
                id={`${block.id}-message`}
                name="message"
                rows={5}
                className="border-line bg-surface-raised text-ink focus:border-ink mt-2 w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>

            <p id={noteId} className="text-ink-dimmed mt-4 text-xs">
              Submissions are not connected yet. The ticket endpoint arrives with
              the commerce-engine API, so this form is intentionally disabled
              rather than accepting messages it cannot deliver.
            </p>

            <button
              type="submit"
              disabled
              aria-describedby={noteId}
              className="bg-brand text-ink-inverted mt-4 cursor-not-allowed rounded-md px-6 py-3 text-sm tracking-wide uppercase opacity-50"
            >
              Send
            </button>
          </form>

          <div className="border-line mt-8 border-t pt-6">
            <h3 className="text-ink text-xs tracking-wide uppercase">
              Other ways to reach us
            </h3>
            <ul className="mt-3 list-none space-y-1 p-0 text-sm">
              {channels.map((channel, i) => (
                <li key={i}>
                  <a href={channel.href} className="text-accent">
                    {channel.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Field({
  id,
  label,
  type = 'text',
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-ink block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="border-line bg-surface-raised text-ink focus:border-ink mt-2 w-full rounded-md border px-3 py-2 text-sm"
      />
    </div>
  );
}
