import type { Metadata } from 'next';
import { Inter, Tajawal } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/app/globals.css';
import '@/styles/rtl.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const inter = Inter({ subsets: ['latin'] });
const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['400', '500', '700'],
  variable: '--font-tajawal',
});

export const metadata: Metadata = {
  title: 'khatak - Your Reliable Shipping Partner',
  description: 'A modern shipping and delivery service',
};

// Client component implementation
const RootLayoutClient = ({ children }: { children: React.ReactNode }) => {
  return (
    <LanguageProvider>
      <AuthProvider>
        <OrderProvider>
          <NotificationProvider>
            {children}
            <ToastContainer position="top-right" autoClose={5000} />
          </NotificationProvider>
        </OrderProvider>
      </AuthProvider>
    </LanguageProvider>
  );
};

// Server component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${tajawal.variable}`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
} 