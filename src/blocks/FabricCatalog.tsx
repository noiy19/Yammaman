import { Container } from '../components/Container';
import { Media } from '../components/Media';
import { Section } from '../components/Section';
import { useCommerce } from '../commerce/CommerceProvider';
import { useAsync } from '../lib/useAsync';
import type { BlockOf } from '../content/types';
import type { Fabric } from '../commerce/client';

/**
 * FabricCatalog — FR-2 in the UI.
 *
 * The rule this component exists to protect: a fabric that is out of stock does
 * NOT leave the catalog. The mill can weave more, so it becomes made-to-order.
 * Only `unavailable` — a fabric that genuinely cannot be woven again — is shown
 * as gone. Getting this backwards silently shrinks the catalog every time
 * something sells out, which is the opposite of the business model.
 *
 * The swatch is the worker-uploaded jpg. FR-3's diffusion output, once Noi
 * approves it, arrives as `previewImage` and is shown in preference to the flat
 * swatch — that is the payoff of the pipeline, so it is a first-class field
 * rather than something bolted on later.
 */
export function FabricCatalog({ block }: { block: BlockOf<'fabricCatalog'> }) {
  const { heading, intro, showAvailability } = block.props;
  const commerce = useCommerce();
  const headingId = `${block.id}-heading`;

  const { data, error, loading } = useAsync(() => commerce.listFabrics(), 'fabrics');

  return (
    <Section labelledBy={heading ? headingId : undefined} tone="raised">
      <Container>
        {heading ? (
          <h2 id={headingId} className="font-display text-ink text-2xl md:text-3xl">
            {heading}
          </h2>
        ) : null}
        {intro ? <p className="text-ink-secondary measure mt-4">{intro}</p> : null}

        <div className="mt-10">
          {loading ? (
            <p className="text-ink-dimmed text-sm" role="status">
              Loading fabrics…
            </p>
          ) : null}

          {error ? (
            <p className="text-danger text-sm" role="alert">
              The fabric catalog could not be loaded. {error.message}
            </p>
          ) : null}

          {data && data.length > 0 ? (
            <ul className="grid list-none grid-cols-2 gap-6 p-0 md:grid-cols-3 lg:grid-cols-5">
              {data.map((fabric) => (
                <li key={fabric.fabricId}>
                  {/*
                    FR-3 payoff: once Noi approves a diffusion result it arrives
                    as `previewImage` and is shown in preference to the flat
                    worker-uploaded swatch. Both are square crops.
                  */}
                  <Media
                    media={fabric.previewImage ?? fabric.swatch}
                    aspect="1/1"
                    className="border-line w-full rounded-md border"
                    sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 50vw"
                  />
                  <h3 className="text-ink mt-3 text-sm font-medium">
                    {fabric.name}
                  </h3>
                  {showAvailability ? (
                    <p className="mt-1 text-xs">
                      <AvailabilityNote fabric={fabric} />
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Container>
    </Section>
  );
}

function AvailabilityNote({ fabric }: { fabric: Fabric }) {
  switch (fabric.availability) {
    case 'in-stock':
      return <span className="text-success">In stock</span>;
    case 'made-to-order':
      return (
        <span className="text-ink-secondary">
          Made to order — the mill weaves more
        </span>
      );
    case 'unavailable':
      return (
        <span className="text-ink-dimmed">
          Not currently weavable
        </span>
      );
  }
}
