import type { Metadata } from 'next';
import { Inter, Tajawal } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@/app/globals.css';
import '@/styles/rtl.css';
import '@/styles/responsive.css';
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
  description: 'مرحبًا بك في خطك، وجهتك الأولى لخدمات النقل البري بين المدن! نحن نقدم حلول نقل آمنة وموثوقة تلبي احتياجات الأفراد والشركات، مع تغطية واسعة تشمل مختلف مناطق المملكة. سواء كنت تنقل شحنة صغيرة أو ترغب في جدولة رحلة نقل بضائع كبيرة، فإننا نوفر لك السهولة والسرعة في الحجز، إلى جانب التزامنا بالمواعيد وجودة الخدمة.',
  icons: {
    icon: '/logo1.svg',
    apple: '/logo1.svg',
  },
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

// HTML Language Attributes Component
const LanguageAttributes = () => {
  const script = `
    (function() {
      try {
        const savedLanguage = localStorage.getItem('app_language') || 'en';
        document.documentElement.lang = savedLanguage;
        document.documentElement.dir = savedLanguage === 'ar' ? 'rtl' : 'ltr';
        if (savedLanguage === 'ar') {
          document.body.classList.add('font-tajawal');
        }
      } catch (e) {
        console.error('Error setting language attributes:', e);
      }
    })();
  `;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
};

// Server component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
        <link rel="icon" href="/logo1.svg" type="image/svg+xml" />
      </head>
      <body className={`${inter.className} ${tajawal.variable}`}>
        <LanguageAttributes />
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
} 