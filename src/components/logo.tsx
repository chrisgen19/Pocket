import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  size?: 'sm' | 'md';
};

/** Pocket wordmark: a red bookmark ribbon beside "Pocket" set in the reading face. */
export function Logo({ className, size = 'md' }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-foreground', className)}>
      <svg
        viewBox="0 0 12 16"
        aria-hidden="true"
        fill="currentColor"
        className={cn('shrink-0 text-primary', size === 'md' ? 'h-5 w-[15px]' : 'h-4 w-3')}
      >
        <path d="M1.5 0h9A1.5 1.5 0 0 1 12 1.5V16l-6-4.5L0 16V1.5A1.5 1.5 0 0 1 1.5 0Z" />
      </svg>
      <span
        className={cn(
          'font-serif font-semibold leading-none tracking-[-0.01em]',
          size === 'md' ? 'text-[1.375rem]' : 'text-lg',
        )}
      >
        Pocket
      </span>
    </span>
  );
}
