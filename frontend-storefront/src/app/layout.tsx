import './globals.css';

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
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
