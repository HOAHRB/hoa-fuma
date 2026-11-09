'use client';

import { useState } from 'react';
import { ExpandedState, flexRender, useTable } from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { FileNode } from '@/lib/types';
import { createColumns } from './columns';
import { fileTreeFeatures } from './table-features';

interface FileTreeTableProps {
  data: FileNode[];
  className?: string;
}

function getInitialExpanded(data: FileNode[]): ExpandedState {
  const expanded: Record<string, boolean> = {};
  const stack: FileNode[][] = [data];

  while (stack.length > 0) {
    const nodes = stack.pop()!;
    for (const node of nodes) {
      if (node.type === 'folder' && node.defaultOpen) {
        expanded[node.id] = true;
      }
      if (node.children) {
        stack.push(node.children);
      }
    }
  }

  return expanded;
}

const columns = createColumns();

export function FileTreeTable({ data, className }: FileTreeTableProps) {
  const [expanded, setExpanded] = useState<ExpandedState>(() =>
    getInitialExpanded(data)
  );

  const table = useTable({
    features: fileTreeFeatures,
    data,
    columns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getSubRows: (row) => row.children,
    getRowId: (row) => row.id,
  });

  const hasResults = table.getRowModel().rows.length > 0;

  return (
    <div className={cn('not-prose flex w-full flex-col gap-4', className)}>
      <div className="bg-background overflow-hidden rounded-md border">
        <Table>
          <TableHeader className="text-xs">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50 whitespace-nowrap"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as
                    | { className?: string }
                    | undefined;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn('h-9 py-2', meta?.className)}
                      style={{
                        width:
                          header.getSize() !== 150
                            ? header.getSize()
                            : undefined,
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {hasResults ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    row.original.type === 'folder' && 'h-12 cursor-pointer'
                  )}
                  onClick={
                    row.original.type === 'folder'
                      ? () => row.toggleExpanded()
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as
                      | { className?: string }
                      | undefined;
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn('py-2', meta?.className)}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center"
                >
                  未找到相关文件
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
