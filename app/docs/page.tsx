import { DocsEntryRedirect } from '@/components/docs/docs-entry-redirect';
import { getAvailableYears } from '@/lib/docs';
export default function Page() {
  return <DocsEntryRedirect fallbackPath={`/docs/${getAvailableYears()[0]}`} />;
}
