import {
  columnSizingFeature,
  columnVisibilityFeature,
  createExpandedRowModel,
  rowExpandingFeature,
  tableFeatures,
} from '@tanstack/react-table';

export const fileTreeFeatures = tableFeatures({
  rowExpandingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  expandedRowModel: createExpandedRowModel(),
});

export type FileTreeFeatures = typeof fileTreeFeatures;
