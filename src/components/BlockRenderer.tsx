import type { ComponentType } from 'react';
import { BLOCK_REGISTRY, isKnownBlockType } from '../blocks/registry';
import type { Block } from '../content/types';

/**
 * BlockRenderer — turns a content document into UI.
 *
 * The unknown-type branch is not defensive padding. It is the failure mode that
 * actually happens: a content PR adds a block type that has not been built, or
 * an old page references one that was renamed. Rendering nothing would ship a
 * page with a silent hole in it; rendering the type by name makes the gap
 * visible in the build, in Storybook, and on staging — which is where it should
 * be caught, not on production.
 */
export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block) => {
        if (!isKnownBlockType(block.type)) {
          return <UnknownBlock key={block.id} type={block.type} id={block.id} />;
        }

        // The registry is typed per-variant, so indexing with the union of
        // types widens to a union of components that TS cannot call with a
        // single argument. The `isKnownBlockType` guard above has already
        // established that this block's type and this component agree.
        const Component = BLOCK_REGISTRY[block.type] as ComponentType<{
          block: Block;
        }>;

        return <Component key={block.id} block={block} />;
      })}
    </>
  );
}

function UnknownBlock({ type, id }: { type: string; id: string }) {
  return (
    <div
      role="alert"
      className="border-danger text-danger page-gutter mx-auto my-6 w-full max-w-6xl rounded-md border border-dashed px-4 py-6 text-sm"
    >
      Unknown block type <code className="font-mono">{type}</code> (id{' '}
      <code className="font-mono">{id}</code>). It is either not built yet or was
      renamed without a content migration.
    </div>
  );
}
