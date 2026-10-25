import {
  Children,
  cloneElement,
  isValidElement,
  type ComponentProps,
  type JSX,
} from 'react';
import { ArrowUpRight } from 'lucide-react';
import Link, { type LinkProps } from 'fumadocs-core/link';
import Image from 'next/image';
import {
  Card as FumadocsCard,
  Cards as FumadocsCards,
} from 'fumadocs-ui/components/card';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { CourseInfo } from '@/components/course-info';
import { CourseIntroduction } from '@/components/course-introduction';
import type { CourseInfoData } from '@/lib/types';
import { Files, Folder, File } from '@/components/file-tree';
import { Accordion, Accordions } from '@/components/ui/accordion';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { cn } from '@/lib/utils';
import { withBasePath } from '@/lib/base-path';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MdxContext = {
  course?: CourseInfoData;
};

type CardProps = ComponentProps<typeof FumadocsCard> & {
  prefetch?: boolean;
};
const Card = FumadocsCard as (props: CardProps) => JSX.Element;

export function NoPrefetchLink(props: LinkProps) {
  return <Link {...props} prefetch={false} />;
}

export function Paragraph({ children, ...props }: ComponentProps<'p'>) {
  const items = Children.toArray(children);
  const child = items[0];
  const isContributionLink =
    items.length === 1 &&
    isValidElement<LinkProps>(child) &&
    (child.props.href === '/about#参与与反馈' ||
      child.props.href === `/about#${encodeURIComponent('参与与反馈')}`);

  if (!isContributionLink) return <p {...props}>{children}</p>;

  return (
    <p {...props} className={cn('not-prose', props.className)}>
      {cloneElement(child, {
        className: cn(
          'inline-flex items-center gap-1 text-fd-primary underline underline-offset-4 transition-colors hover:text-fd-primary/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fd-ring',
          child.props.className
        ),
        children: (
          <>
            {child.props.children}
            <ArrowUpRight aria-hidden className="size-4" />
          </>
        ),
      })}
    </p>
  );
}

function NoPrefetchCard(props: CardProps) {
  return (
    <Card
      {...props}
      prefetch={false}
      className={cn(
        'bg-white hover:bg-white dark:bg-transparent dark:hover:bg-transparent',
        props.className
      )}
    />
  );
}

function Cards(props: ComponentProps<typeof FumadocsCards>) {
  return (
    <FumadocsCards
      {...props}
      className={cn('[&>*:only-child]:col-span-full', props.className)}
    />
  );
}

function SiteIcon({
  className,
  src,
  ...props
}: Omit<ComponentProps<typeof Image>, 'width' | 'height'>) {
  return (
    <Image
      {...props}
      src={
        typeof src === 'string' && src.startsWith('/') ? withBasePath(src) : src
      }
      width={24}
      height={24}
      className={cn('size-4', className)}
    />
  );
}

export function getMDXComponents(
  components?: MDXComponents,
  context?: MdxContext
) {
  return {
    ...defaultMdxComponents,
    p: Paragraph,
    Cards,
    Files,
    Folder,
    File,
    Accordion,
    Accordions,
    Step,
    Steps,
    SiteIcon,
    Card: NoPrefetchCard,
    CourseInfo: (props: ComponentProps<typeof CourseInfo>) => (
      <CourseInfo {...props} data={props.data ?? context?.course} />
    ),
    CourseIntroduction: (props: ComponentProps<typeof CourseIntroduction>) => (
      <CourseIntroduction
        {...props}
        data={props.data ?? context?.course?.introduction}
      />
    ),
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
