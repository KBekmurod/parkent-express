import { Loader2 } from 'lucide-react';

export default function Loading({ size = 'default' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-gray-400`} />
    </div>
  );
}
