import './globals.css';
import { Toast } from '@/components/Toast';

export const metadata = {
  title: 'E-commerce MVP - Storefront',
  description: 'Customer storefront for the E-commerce MVP marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        {children}
        {/* Toast thông báo toàn cục (NFR UX) */}
        <Toast />
      </body>
    </html>
  );
}
