import type { Metadata } from 'next';
import { poppins, inter } from '@/lib/fonts';
import './globals.css';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata: Metadata = {
  title: 'Delivery — Trusted motorcycle delivery for Kigali',
  description:
    'Connect senders with vetted motorcycle couriers through a platform that makes every delivery accountable — with live tracking, chain-of-custody OTP handover, and proof of delivery.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    other: [
      { rel: 'apple-touch-icon-precomposed', url: '/apple-touch-icon.png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${poppins.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-bg-page font-body antialiased">
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
