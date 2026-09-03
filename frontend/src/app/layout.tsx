import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Event Manager Dashboard',
  description: 'Create events, collect applications and manage participants.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            Event Manager Dashboard — Next.js + Express + PostgreSQL
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
