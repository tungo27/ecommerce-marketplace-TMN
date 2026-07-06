import React from 'react';

interface AuthFormProps {
  title: string;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  
  onSubmit,
  isLoading = false,
  error,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 p-8">
          <h2 className="text-3xl font-extrabold text-center text-gray-900 mb-8 tracking-tight">
            {title}
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-primary-light border border-primary rounded-md">
              <p className="text-sm text-primary font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            {children}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
