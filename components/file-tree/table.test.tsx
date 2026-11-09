// @vitest-environment jsdom
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { FileTreeTable } from './table';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('shows single downloads without toolbar, preview or bulk selection, including on mobile', () => {
  const markup = renderToStaticMarkup(
    createElement(FileTreeTable, {
      data: [
        {
          id: '笔记.pdf',
          name: '笔记.pdf',
          type: 'file',
          depth: 0,
          url: 'https://raw.githubusercontent.com/HOAHRB-Courses/TEST101/main/notes.pdf',
        },
      ],
    })
  );
  expect(markup).toContain('下载 笔记.pdf');
  expect(markup).not.toContain('hidden sm:inline-flex');
  expect(markup).not.toContain('校园网加速');
  expect(markup).not.toContain('网盘计划');
  expect(markup).not.toContain('批量下载');
  expect(markup).not.toContain('prev.hoa.moe');
  expect(markup).not.toContain('role="checkbox"');
  expect(markup).not.toContain('placeholder="搜索"');
});

it('expands folders and renders a direct browser download link without fetching the file', async () => {
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  const host = document.createElement('div');
  const root = createRoot(host);
  try {
    await act(() =>
      root.render(
        createElement(FileTreeTable, {
          data: [
            {
              id: 'notes',
              name: 'notes',
              type: 'folder',
              depth: 0,
              children: [
                {
                  id: 'notes/笔记.pdf',
                  name: '笔记.pdf',
                  type: 'file',
                  depth: 1,
                  url: 'https://raw.githubusercontent.com/HOAHRB-Courses/TEST101/main/notes/%E7%AC%94%E8%AE%B0.pdf',
                },
              ],
            },
          ],
        })
      )
    );
    expect(host.textContent).not.toContain('笔记.pdf');
    await act(() =>
      host
        .querySelector<HTMLButtonElement>('[aria-label="展开 notes"]')!
        .click()
    );
    expect(host.textContent).toContain('笔记.pdf');
    const link = host.querySelector<HTMLAnchorElement>(
      'a[aria-label="下载 笔记.pdf"]'
    );
    expect(link).not.toBeNull();
    expect(link!.href).toBe(
      'https://github.com/HOAHRB-Courses/TEST101/raw/main/notes/%E7%AC%94%E8%AE%B0.pdf'
    );
    expect(link!.download).toBe('笔记.pdf');
    expect(link!.target).toBe('_blank');
    expect(link!.rel).toContain('noopener');
    let preventedByComponent = false;
    link!.addEventListener(
      'click',
      (event) => {
        preventedByComponent = event.defaultPrevented;
        // Prevent jsdom navigation after observing the component's behavior.
        event.preventDefault();
      },
      { once: true }
    );
    await act(() => link!.click());
    expect(preventedByComponent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
});
