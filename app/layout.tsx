import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { getTranslationServer } from '@/i18n/server';
import { I18nProvider } from '@/i18n/I18nProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LuxeEstate | Luxury Real Estate',
  description: 'Find your sanctuary with LuxeEstate luxury properties.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale } = await getTranslationServer();

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,0,0"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${inter.variable} font-display antialiased bg-clear-day text-nordic`}
      >
        <I18nProvider initialLocale={locale}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
