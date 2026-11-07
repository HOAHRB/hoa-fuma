'use client';

import {
  SearchDialog as FumadocsSearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogFooter,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogOverlay,
  TagsList,
  TagsListItem,
} from 'fumadocs-ui/components/dialog/search';
import type { DefaultSearchDialogProps } from 'fumadocs-ui/components/dialog/search-default';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { useOnChange } from 'fumadocs-core/utils/use-on-change';
import { useMemo, useState } from 'react';
import { LoaderCircle } from 'lucide-react';

type SearchDialogProps = Omit<DefaultSearchDialogProps, 'type'>;

function EmptySearchResults() {
  return (
    <div className="text-fd-muted-foreground py-12 text-center text-sm">
      未找到相关结果
    </div>
  );
}

export function SearchDialog({
  defaultTag,
  tags = [],
  api,
  delayMs,
  allowClear = false,
  links = [],
  footer,
  ...props
}: SearchDialogProps) {
  const { locale } = useI18n();
  const [tag, setTag] = useState(defaultTag);
  const client = useMemo(
    () => fetchClient({ api, locale, tag }),
    [api, locale, tag]
  );
  const { search, setSearch, query } = useDocsSearch({ client, delayMs });
  const defaultItems = useMemo(() => {
    if (links.length === 0) return null;
    return links.map(([name, link]) => ({
      type: 'page' as const,
      id: name,
      content: name,
      url: link,
    }));
  }, [links]);
  const items = query.data !== 'empty' ? query.data : defaultItems;

  useOnChange(defaultTag, (value) => {
    setTag(value);
  });

  return (
    <FumadocsSearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent>
        <SearchDialogHeader>
          {query.isLoading ? (
            <LoaderCircle
              aria-hidden="true"
              className="text-fd-muted-foreground size-5 animate-spin motion-reduce:animate-none"
            />
          ) : (
            <SearchDialogIcon />
          )}
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        <div role="status" aria-live="polite" aria-atomic="true">
          {query.isLoading ? (
            <p className="text-fd-muted-foreground px-3 py-2 text-sm">
              正在搜索…
            </p>
          ) : query.error ? (
            <p className="text-fd-error px-3 py-2 text-sm">
              搜索失败，请稍后重试。
            </p>
          ) : null}
        </div>
        <SearchDialogList
          aria-busy={query.isLoading}
          items={
            (query.isLoading || query.error) && items?.length === 0
              ? null
              : items
          }
          Empty={EmptySearchResults}
        />
      </SearchDialogContent>
      <SearchDialogFooter>
        {tags.length > 0 && (
          <TagsList tag={tag} onTagChange={setTag} allowClear={allowClear}>
            {tags.map((tag) => (
              <TagsListItem key={tag.value} value={tag.value}>
                {tag.name}
              </TagsListItem>
            ))}
          </TagsList>
        )}
        {footer}
      </SearchDialogFooter>
    </FumadocsSearchDialog>
  );
}
