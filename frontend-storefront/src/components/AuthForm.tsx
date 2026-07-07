import React from 'react';
import Link from 'next/link';

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
    <div 
      className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("https://res.cloudinary.com/gnlx1ljp/image/upload/v1783390934/ChatGPT_Image_Jul_7_2026_08_55_23_AM_dvlhkm.png")' }}
    >
      <Link href="/" className="mb-8 hover:opacity-90 transition-opacity">
        <h1 className="text-4xl font-extrabold text-primary tracking-tight drop-shadow-md">
          E-commerce MVP
        </h1>
      </Link>
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
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 px-6 rounded-md shadow-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 mt-2 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
