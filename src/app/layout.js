import { Inter } from 'next/font/google';
import './globals.css';
import SessionProvider from '@/components/auth/SessionProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Property Dealer CRM',
  description: 'Level 3 CRM System for Property Dealers in Pakistan',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
