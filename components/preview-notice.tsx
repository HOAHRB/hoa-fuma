'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';
import { PROJECT_URL } from '@/lib/brand';
import { Toaster } from '@/components/ui/sonner';

export function PreviewNotice() {
  useEffect(() => {
    const id = toast.info('预览站点说明', {
      id: 'preview-notice',
      position: 'bottom-right',
      duration: Infinity,
      closeButton: true,
      description: (
        <>
          本站目前处于预览阶段。受部署服务器性能限制，页面访问和搜索服务可能频繁出现响应缓慢、加载失败等问题。如无法正常使用，可暂时前往{' '}
          <a
            href={PROJECT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4"
          >
            GitHub 仓库
          </a>
          查阅内容。
        </>
      ),
    });

    return () => {
      toast.dismiss(id);
    };
  }, []);

  return <Toaster toastOptions={{ closeButtonAriaLabel: '关闭通知' }} />;
}
