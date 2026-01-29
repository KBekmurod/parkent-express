import { PackageOpen } from 'lucide-react';

export default function EmptyState({ message = 'No data available', icon: Icon = PackageOpen }) {
  return (
    <div className="text-center py-12">
      <Icon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
    </div>
  );
}
