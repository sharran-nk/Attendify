import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: ReactNode | string;
  subtitle?: ReactNode | string;
  rightAction?: ReactNode;
}

/** Page header + content column. Navigation and the route fade live in AppShell. */
export function PageContainer({ children, title, subtitle, rightAction }: PageContainerProps) {
  return (
    <>
      {(title || rightAction) && (
        <header className="sticky top-0 z-30 glass-effect px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3">
            <div className="min-w-0">
              {title && (
                <h1 className="truncate text-[1.75rem] font-bold leading-tight tracking-tight text-foreground">
                  {title}
                </h1>
              )}
              {subtitle && <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            {rightAction}
          </div>
        </header>
      )}
      <main className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6 lg:px-8">{children}</main>
    </>
  );
}
