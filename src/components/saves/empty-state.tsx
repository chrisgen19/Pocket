import { Bookmark } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 text-gray-400">
        <Bookmark className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      <p className="mt-1 text-gray-500">{description}</p>
    </div>
  );
}
