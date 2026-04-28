import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Toaster } from 'react-hot-toast';
import MigrationBanner from "@/components/layout/MigrationBanner";

export const metadata: Metadata = {
  title: "ITP Ready — TOEFL ITP Practice Tests by English with Arik",
  description: "Authentic TOEFL ITP Level 1 practice tests with Listening, Structure & Written Expression, and Reading Comprehension. Official-style scoring on the 310–677 scale.",
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        <MigrationBanner />
        <LanguageProvider>
          <AuthProvider>
            <Toaster
              position="top-center"
              toastOptions={{
                style: {
                  borderRadius: '12px',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  fontSize: '14px',
                },
              }}
            />
            {children}
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
