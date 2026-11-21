import React from 'react';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  message?: string | null;
  className?: string;
}

export const FormError: React.FC<FormErrorProps> = ({
  message,
  className = '',
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={`p-3 rounded-xl bg-[#991B1B]/10 border border-[#991B1B]/25 text-xs font-semibold text-[#991B1B] flex items-center gap-2 ${className}`.trim()}
    >
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
};
