import { Container } from '../components/Container';
import { Media } from '../components/Media';
import { Section } from '../components/Section';
import { SectionHeader } from '../components/SectionHeader';
import { useCommerce } from '../commerce/CommerceProvider';
import { useAsync } from '../lib/useAsync';
import type { BlockOf } from '../content/types';

const COLUMNS: Record<number, string> = {
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

const AVAILABILITY_LABEL: Record<string, string> = {
  'in-stock': 'In stock',
  'made-to-order': 'Made to order',
};

/**
 * ProductGrid — reads the catalogue from the engine.
 *
 * The block selects a SLICE ("in-stock", "made-to-order"); it does not define
 * products. That boundary is the whole point of the engine split: the client
 * can choose what to show, and cannot invent a product that does not exist in
 * the OMS.
 *
 * The empty and error states are written out rather than left blank. An empty
 * grid on a storefront page is indistinguishable from a broken one, and the
 * person who finds out is a customer.
 *
 * The numbered caption ("(1) Aizu Cotton Shirt") comes from the de-Framer
 * reference, which indexes its grid items the same way. It is derived from the
 * array position rather than authored, so a client reordering products cannot
 * produce a grid numbered 1, 2, 2, 4.
 */
export function ProductGrid({ block }: { block: BlockOf<'productGrid'> }) {
  const { heading, intro, source, limit, columns = 3, link } = block.props;
  const commerce = useCommerce();
  const headingId = `${block.id}-heading`;

  const { data, error, loading } = useAsync(
    () => commerce.listProducts({ source, limit }),
    `${source}:${limit ?? 'all'}`,
  );

  return (
    <Section labelledBy={heading ? headingId : undefined}>
      <Container>
        {heading ? (
          <SectionHeader
            id={headingId}
            label={heading}
            meta={data ? `${data.length} pieces` : undefined}
            link={link}
          />
        ) : null}

        {intro ? (
          <p className="text-ink-secondary measure mt-6">{intro}</p>
        ) : null}

        <div className="mt-8">
          {loading ? (
            <p className="text-ink-dimmed text-micro" role="status">
              Loading products…
            </p>
          ) : null}

          {error ? (
            <p className="text-danger text-micro" role="alert">
              The catalogue could not be loaded. {error.message}
            </p>
          ) : null}

          {!loading && !error && data && data.length === 0 ? (
            <p className="text-ink-secondary text-micro">
              Nothing is listed here right now.
            </p>
          ) : null}

          {data && data.length > 0 ? (
            <ul
              className={`grid list-none grid-cols-1 gap-4 p-0 ${COLUMNS[columns] ?? COLUMNS[3]}`}
            >
              {data.map((product, index) => (
                <li key={product.productId}>
                  <Media
                    media={product.image}
                    className="border-line w-full border"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                  <h3 className="text-ink mt-3 text-micro font-semibold">
                    <span className="text-ink-dimmed mr-2 tabular-nums">
                      ({index + 1})
                    </span>
                    {product.name}
                  </h3>
                  <p className="text-ink-secondary mt-1 text-micro">
                    {product.priceLabel}
                  </p>
                  <p className="text-ink-dimmed mt-1 text-micro tracking-eyebrow uppercase">
                    {AVAILABILITY_LABEL[product.availability]}
                  </p>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}
