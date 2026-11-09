import { Children, isValidElement, ReactElement, ReactNode } from 'react';
import {
  FileArchive,
  FileIcon,
  FileSpreadsheet,
  FileTextIcon,
  FileHeadphone,
  FileImage,
  FilePlay,
  FileChartPie,
  LucideIcon,
} from 'lucide-react';
import type { FileNode, FileProps, FolderProps } from '@/lib/types';

const EXTENSION_MAP: Record<string, LucideIcon> = {
  pdf: FileTextIcon,
  doc: FileTextIcon,
  docx: FileTextIcon,
  txt: FileTextIcon,
  md: FileTextIcon,
  mdx: FileTextIcon,
  ppt: FileChartPie,
  pptx: FileChartPie,
  xls: FileSpreadsheet,
  xlsx: FileSpreadsheet,
  csv: FileSpreadsheet,
  zip: FileArchive,
  rar: FileArchive,
  '7z': FileArchive,
  tar: FileArchive,
  gz: FileArchive,
  mp4: FilePlay,
  mov: FilePlay,
  webm: FilePlay,
  mkv: FilePlay,
  mp3: FileHeadphone,
  wav: FileHeadphone,
  flac: FileHeadphone,
  m4a: FileHeadphone,
  png: FileImage,
  jpg: FileImage,
  jpeg: FileImage,
  gif: FileImage,
  webp: FileImage,
  svg: FileImage,
};

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileExtension(url?: string) {
  if (!url) return '';
  const pathname = url.includes('://') ? new URL(url).pathname : url;
  return pathname.split('.').pop()?.toLowerCase() || '';
}

export function getFileIcon(url?: string) {
  const ext = getFileExtension(url);
  const Icon = EXTENSION_MAP[ext] || FileIcon;
  return <Icon className="size-4 opacity-60" aria-hidden="true" />;
}

/**
 * Transforms React children (declarative MDX structure) into a flat array of FileNode objects.
 */
export function transformChildrenToData(
  nodes: ReactNode,
  parentPath: string = '',
  depth: number = 0
): FileNode[] {
  const result: FileNode[] = [];

  Children.forEach(nodes, (child) => {
    if (!isValidElement(child)) return;

    const element = child as ReactElement<FileProps | FolderProps>;
    const { name } = element.props;
    if (!name) return;

    const fullPath = parentPath ? `${parentPath}/${name}` : name;

    const children = (element.props as FolderProps).children;
    const isFolder = children !== undefined;

    if (isFolder) {
      const folderProps = element.props as FolderProps;
      const childNodes = transformChildrenToData(children, fullPath, depth + 1);

      result.push({
        id: fullPath,
        name,
        type: 'folder',
        depth,
        date: folderProps.date,
        size: folderProps.size,
        defaultOpen:
          folderProps.defaultOpen === true ||
          folderProps.defaultOpen === 'true',
        children: childNodes.length > 0 ? childNodes : undefined,
      });
    } else {
      const fileProps = element.props as FileProps;
      result.push({
        id: fullPath,
        name,
        type: 'file',
        url: fileProps.url,
        size: fileProps.size,
        date: fileProps.date,
        fileType: fileProps.type,
        depth,
      });
    }
  });

  return result;
}

// Support both current and previously generated MDX download URLs.
export function getDownloadUrl(value: string): string {
  const url = new URL(value);
  if (
    url.protocol === 'https:' &&
    url.hostname === 'gh.hoa.moe' &&
    url.pathname.startsWith('/github.com/HOAHRB-Courses/')
  ) {
    return 'https://github.com' + url.pathname.slice('/github.com'.length);
  }
  if (
    url.protocol === 'https:' &&
    url.hostname === 'raw.githubusercontent.com'
  ) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 4) {
      const [owner, repo, ref, ...path] = parts;
      return (
        'https://github.com/' +
        owner +
        '/' +
        repo +
        '/raw/' +
        ref +
        '/' +
        path.join('/')
      );
    }
  }
  return value;
}
