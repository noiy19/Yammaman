/**
 * CommerceProvider.tsx — supplies the active CommerceClient.
 *
 * Today it always resolves to the fixture. The day the engine rundown lands,
 * the change is confined to this file: construct an HTTP client against
 * COMMERCE_API_BASE and hand it back instead. Every block already consumes the
 * interface, so no call site moves.
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { CommerceClient } from './client';
import { fixtureCommerceClient } from './fixture';

const CommerceContext = createContext<CommerceClient>(fixtureCommerceClient);

export function CommerceProvider({
  client = fixtureCommerceClient,
  children,
}: {
  client?: CommerceClient;
  children: ReactNode;
}) {
  return (
    <CommerceContext.Provider value={client}>{children}</CommerceContext.Provider>
  );
}

export function useCommerce(): CommerceClient {
  return useContext(CommerceContext);
}
