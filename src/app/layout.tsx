import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'SRI SAI SIRI BOYS HOSTEL | Hostel Management Platform',
  description: 'Management portal and automated room allocations for Sri Sai Siri Boys Hostel.',
  authors: [{ name: 'Antigravity AI' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07040f',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-primary/30">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
