import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import '@/index.css';

export const metadata: Metadata = {
  title: 'Ordery',
  description: 'Sistema de pedidos online',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <AuthProvider>
          <CartProvider>
            <Toaster position="top-right" />
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
