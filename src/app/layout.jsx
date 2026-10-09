import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import '../index.css';
import { Providers } from './providers';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: { default: 'Env Master', template: '%s | Env Master' },
  description: 'Env Master - Secure environment variables manager with encrypted storage and granular role-based access',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffd369' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='2'/><path d='m9 12 2 2 4-4'/></svg>"
  }
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`h-full bg-ink text-paper ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="h-full bg-ink font-sans antialiased selection:bg-brand/30 selection:text-brand">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
