import { Container } from '../components/Container';
import { Section } from '../components/Section';
import type { BlockOf } from '../content/types';

/**
 * Stores — physical stockists.
 *
 * Rendered as a definition-ish list of <address> elements so the address is
 * machine-readable. `addressLines` is an array rather than one string because
 * line breaks are formatting and formatting inside a content string is how you
 * end up rendering `<br>` from JSON.
 */
export function Stores({ block }: { block: BlockOf<'stores'> }) {
  const { heading, stores } = block.props;
  const headingId = `${block.id}-heading`;

  return (
    <Section labelledBy={heading ? headingId : undefined}>
      <Container>
        {heading ? (
          <h2 id={headingId} className="font-display text-ink text-2xl md:text-3xl">
            {heading}
          </h2>
        ) : null}

        <ul className="mt-10 grid list-none gap-10 p-0 md:grid-cols-2">
          {stores.map((store, i) => (
            <li key={i} className="border-line border-t pt-5">
              <h3 className="text-ink text-base font-medium">{store.name}</h3>
              <address className="text-ink-secondary mt-2 text-sm not-italic">
                {store.addressLines.map((line, j) => (
                  <span key={j} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {store.hours ? (
                <p className="text-ink-secondary mt-2 text-sm">{store.hours}</p>
              ) : null}
              {store.phone ? (
                <p className="text-ink-secondary mt-1 text-sm">
                  <a
                    href={`tel:${store.phone.replace(/\s+/g, '')}`}
                    className="text-accent"
                  >
                    {store.phone}
                  </a>
                </p>
              ) : null}
              {store.mapHref ? (
                <p className="mt-2 text-sm">
                  <a href={store.mapHref} className="text-accent">
                    Open map
                  </a>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
