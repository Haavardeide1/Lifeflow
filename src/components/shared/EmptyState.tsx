'use client';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <h3 className="text-[16px] font-semibold text-gray-600 dark:text-white/70 mb-2">{title}</h3>
      <p className="text-[13px] text-gray-400 dark:text-white/40 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
