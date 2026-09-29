import './globals.css';
import { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'CRM Producción Comercial | Gestión de Solicitudes (SP)',
  description: 'Sistema integral de recepción, asignación, seguimiento y entrega de solicitudes de producción publicitaria y comercial.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
