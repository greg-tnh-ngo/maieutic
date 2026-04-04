import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Maieutic',
  description: 'Espace de pensée dialectique',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full overflow-hidden" style={{ background: '#0d0d0f', color: '#e8e8f0' }}>
        {children}
      </body>
    </html>
  );
}
