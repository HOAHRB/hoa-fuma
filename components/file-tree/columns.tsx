'use client';

import { ColumnDef, Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { DownloadIcon, Folder, FolderOpen } from 'lucide-react';
import type { FileNode } from '@/lib/types';
import { getFileIcon, getDownloadUrl, formatBytes } from './utils';
import type { FileTreeFeatures } from './table-features';

function NameCell({ row }: { row: Row<FileTreeFeatures, FileNode> }) {
  const node = row.original;
  const isFolder = node.type === 'folder';
  const isExpanded = row.getIsExpanded();

  return (
    <div
      className="flex items-start gap-2 pl-[calc(var(--depth)*var(--file-tree-indent-mobile))] sm:items-center sm:pl-[calc(var(--depth)*var(--file-tree-indent-desktop))]"
      style={{ '--depth': node.depth } as React.CSSProperties}
    >
      {isFolder ? (
        <button
          aria-label={`${isExpanded ? '收起' : '展开'} ${node.name}`}
          aria-expanded={isExpanded}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          className="mt-1 flex shrink-0 items-center sm:mt-0"
        >
          {isExpanded ? (
            <FolderOpen className="size-4 opacity-60" />
          ) : (
            <Folder className="size-4 opacity-60" />
          )}
        </button>
      ) : (
        <span className="mt-1 shrink-0 sm:mt-0">{getFileIcon(node.url)}</span>
      )}
      <span className="min-w-0 flex-1 text-wrap break-normal">{node.name}</span>
    </div>
  );
}

function ActionsCell({ row }: { row: Row<FileTreeFeatures, FileNode> }) {
  const node = row.original;
  if (node.type === 'folder' || !node.url) {
    return null;
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        nativeButton={false}
        role="link"
        render={
          <a
            href={getDownloadUrl(node.url)}
            download={node.name}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(event) => event.stopPropagation()}
          />
        }
        aria-label={`下载 ${node.name}`}
        title={`下载 ${node.name}`}
      >
        <DownloadIcon className="size-4" />
      </Button>
    </div>
  );
}

export function createColumns(): ColumnDef<FileTreeFeatures, FileNode>[] {
  return [
    {
      accessorKey: 'name',
      header: '文件名',
      cell: ({ row }) => <NameCell row={row} />,
      meta: {
        className: 'whitespace-normal min-w-0',
      },
    },
    {
      accessorKey: 'size',
      header: '文件大小',
      cell: ({ row }) => {
        const size = row.getValue('size') as number | undefined;
        return (
          <span className="text-muted-foreground">
            {size ? formatBytes(size) : '-'}
          </span>
        );
      },
      meta: {
        className: 'hidden sm:table-cell',
      },
    },
    {
      accessorKey: 'date',
      header: '最后修改日期',
      cell: ({ row }) => {
        const node = row.original;
        return (
          <span className="text-muted-foreground">{node.date || '-'}</span>
        );
      },
      meta: {
        className: 'hidden sm:table-cell',
      },
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => <ActionsCell row={row} />,
      size: 48,
    },
  ];
}
