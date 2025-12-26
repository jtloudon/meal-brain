import AuthenticatedLayout from '@/components/AuthenticatedLayout';

export default function SettingsPage() {
  return (
    <AuthenticatedLayout title="Settings">
      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Settings Coming Soon
          </h2>
          <p className="text-sm text-gray-600">
            User preferences, household management, and AI settings will be
            available here
          </p>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}
