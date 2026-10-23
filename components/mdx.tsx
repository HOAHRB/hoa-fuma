import {
  courseDescription,
  MISSING_COURSE_COPY,
  missingCourseParagraph,
} from '@/lib/course-brand';
import {
  Children,
  isValidElement,
  type ReactNode,
  type ComponentProps,
  type JSX,
} from 'react';
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

function paragraphText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number')
        return String(child);
      return isValidElement<{ children?: ReactNode }>(child)
        ? paragraphText(child.props.children)
        : '';
    })
    .join('');
}

function CourseParagraph(props: ComponentProps<'p'>) {
  const state = missingCourseParagraph(paragraphText(props.children));
  if (state === 'guide') return null;
  if (state === 'notice')
    return (
      <div className="max-w-prose">
        {MISSING_COURSE_COPY.split('\n\n').map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <p>
          <NoPrefetchLink href="/about#参与与反馈">参与与反馈</NoPrefetchLink>
        </p>
      </div>
    );
  return (
    <p {...props}>
      {Children.map(props.children, (child) =>
        typeof child === 'string' ? courseDescription(child) : child
      )}
    </p>
  );
}

export function getMDXComponents(
  components?: MDXComponents,
  context?: MdxContext
) {
  return {
    ...defaultMdxComponents,
    p: CourseParagraph,
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
