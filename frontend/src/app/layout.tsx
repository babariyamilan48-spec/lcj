import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import ApiInterceptorInit from '@/components/ApiInterceptorInit';
import ScrollToTop from '@/components/ScrollToTop';
import NavigationHistoryTracker from '@/components/NavigationHistoryTracker';
import { MobileBackHandler } from '@/components/MobileBackHandler';


const inter = Inter({ subsets: ['latin'] });
const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins'
});

export const metadata: Metadata = {
  title: 'જીવન પરિવર્તન સફર - Life Changing Journey',
  description: 'વ્યાપક મનોવૈજ્ઞાનિક મૂલ્યાંકન અને કારકિર્દી માર્ગદર્શન પ્લેટફોર્મ',
  keywords: 'career assessment, personality test, career guidance, psychological testing, gujarati, જીવન પરિવર્તન સફર',
  authors: [{ name: 'LCJ Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="gu" dir="ltr" className="overflow-x-hidden">
      <body className={`${poppins.variable} font-sans overflow-x-hidden`}>
        <ApiInterceptorInit />
        <Providers>
          <NavigationHistoryTracker />
          <MobileBackHandler />
          {children}
          <ScrollToTop />
        </Providers>
      </body>
    </html>
  );
}
