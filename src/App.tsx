import { useLocation } from 'react-router-dom';
import { CommerceProvider } from './commerce/CommerceProvider';
import { loadPageByPath, normalisePath } from './content/loadContent';
import { tenantForPath } from './tenant/tenants';
import { ContentPage, NotFound } from './pages/ContentPage';

/**
 * App — tenant resolution, then page resolution.
 *
 * There is deliberately NO route table. Routes are content: a page exists
 * because a JSON document claims its path. Two consequences worth stating
 * plainly, because they are the design and not an oversight:
 *
 *   1. Adding a page is a content change. No code, no route registration.
 *   2. Two pages claiming the same path is a hard error at load
 *      (see loadContent.ts), not a silent "last one wins".
 *
 * The tenant is resolved first and independently of the page, and the page load
 * is then scoped to that tenant. The brand surface owns '/', which prefixes
 * every path on the site — resolving the page first and inferring the tenant
 * from it would let a mill page be served under the brand's chrome.
 */
export function App() {
  const { pathname } = useLocation();

  const tenant = tenantForPath(pathname);
  const page = loadPageByPath(normalisePath(pathname));

  return (
    <CommerceProvider>
      {page && page.tenantId === tenant.tenantId ? (
        <ContentPage tenant={tenant} page={page} />
      ) : (
        <NotFound tenant={tenant} />
      )}
    </CommerceProvider>
  );
}
