import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import { Plus } from 'lucide-react';

export default function GroceriesPage() {
  return (
    <AuthenticatedLayout
      title="Grocery Lists"
      action={
        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
          <Plus size={20} />
        </button>
      }
    >
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
        <div className="text-center max-w-sm">
          <div className="mb-4 text-gray-400">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No grocery lists yet
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Create a list to start tracking your shopping needs
          </p>
          <button className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            Create Your First List
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
