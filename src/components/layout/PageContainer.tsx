import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  title?: ReactNode | string;
  subtitle?: ReactNode | string;
  rightAction?: ReactNode;
}

export function PageContainer({ children, title, subtitle, rightAction }: PageContainerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-20 pt-safe"
    >
      {(title || rightAction) && (
        <header className="sticky top-0 z-40 rounded-b-3xl bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 px-4 pb-4 pt-[calc(0.75rem+env(safe-area-inset-top))] text-white shadow-lg shadow-red-500/20">
          <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
            <div>
              {title && (
                <h1 className="text-[22px] font-semibold tracking-tight text-white">{title}</h1>
              )}
              {subtitle && (
                <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>
              )}
            </div>
            {rightAction}
          </div>
        </header>
      )}
      <main className="px-4 py-3 w-full max-w-7xl mx-auto">
        {children}
      </main>
    </motion.div>
  );
}
