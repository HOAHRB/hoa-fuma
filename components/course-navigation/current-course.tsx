import { MapPin } from 'lucide-react';

export function CurrentCourse() {
  return (
    <span
      title="当前页面课程"
      className="text-fd-primary inline-flex shrink-0 self-center"
    >
      <MapPin aria-label="当前页面课程" className="size-3" />
    </span>
  );
}
