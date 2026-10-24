import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

const pillColors: Record<string, string> = {
  必修: 'bg-[#d2e8ef] text-[#2b5d70] dark:bg-[#27443f] dark:text-[#bcebdc]',
  限选: 'bg-[#e2e8f2] text-[#506683] dark:bg-[#363b52] dark:text-[#cdd0ef]',
  考试: 'bg-[#e3d9ef] text-[#62427e] dark:bg-[#443452] dark:text-[#e5cff8]',
};

const categoryColors: Record<string, string> = {
  专业基础: 'bg-[#e9e2bf] text-[#65591f] dark:bg-[#494424] dark:text-[#eadf9f]',
  专业核心: 'bg-[#efd8ce] text-[#82462f] dark:bg-[#57362d] dark:text-[#f2c4b1]',
  思政: 'bg-[#eed9dc] text-[#793e48] dark:bg-[#542c35] dark:text-[#f5bfc9]',
  体育: 'bg-[#dde8d7] text-[#3d6030] dark:bg-[#284735] dark:text-[#b6e3c4]',
  英语: 'bg-[#dce6f3] text-[#304f79] dark:bg-[#273d59] dark:text-[#bbd8ff]',
};

export function CoursePill({
  children,
  tone,
  category = false,
  className,
  ...props
}: ComponentProps<'span'> & { tone?: string; category?: boolean }) {
  const palette = category ? categoryColors : pillColors;
  return (
    <span
      {...props}
      className={cn(
        'rounded-full px-2 py-0.5 text-xs',
        (tone && Object.hasOwn(palette, tone) && palette[tone]) ||
          'bg-fd-muted text-fd-muted-foreground',
        className
      )}
    >
      {children}
    </span>
  );
}
