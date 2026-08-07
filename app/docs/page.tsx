import { redirect } from 'next/navigation';
import { getAvailableYears } from '@/lib/docs';

function getDocsFallbackPath() {
  return `/docs/${getAvailableYears()[0]}`;
}

export default function Page() {
  redirect(getDocsFallbackPath());
}
