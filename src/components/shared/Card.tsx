'use client';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, action }: CardProps) {
  return (
    <div className={`bg-[#1c1c24] border border-white/[0.06] rounded-2xl overflow-hidden ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-[14px] font-semibold text-white/90">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
