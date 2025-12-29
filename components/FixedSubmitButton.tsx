'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FixedSubmitButtonProps {
  formId: string;
  disabled: boolean;
  loading: boolean;
  loadingText: string;
  submitText: string;
}

export default function FixedSubmitButton({
  formId,
  disabled,
  loading,
  loadingText,
  submitText,
}: FixedSubmitButtonProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const button = (
    <div className="fixed bottom-20 left-0 right-0 px-4 z-[60] pointer-events-none">
      <button
        type="submit"
        form={formId}
        disabled={disabled}
        className="w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg pointer-events-auto"
      >
        {loading ? loadingText : submitText}
      </button>
    </div>
  );

  // Only render on client-side to avoid hydration mismatch
  if (!mounted) return null;

  // Render to document.body using portal to bypass overflow containers
  return createPortal(button, document.body);
}
