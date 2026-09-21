import React from 'react';
import { cn } from '@/lib/utils';
import { Disclaimer } from './Disclaimer';

interface AiOutputProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function AiOutput({ children, className, ...props }: AiOutputProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
      <div className="mt-6">
        <Disclaimer />
      </div>
    </div>
  );
}
