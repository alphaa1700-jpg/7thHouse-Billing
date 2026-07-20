import type { Metadata, Viewport } from "next";
import "@/styles/globals.scss";

export const viewport: Viewport = {
  themeColor: "#1a0f08",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "7th House Coffee — Admin POS",
  description: "Admin console and POS for 7th House Coffee café",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "7th House POS",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const extensionGuard = `
    (function () {
      const isExtensionError = (source) => typeof source === 'string' && source.startsWith('chrome-extension://');

      function handleError(event) {
        const filename = event && event.filename ? event.filename : '';
        if (isExtensionError(filename)) {
          event.preventDefault?.();
          event.stopImmediatePropagation?.();
          return false;
        }
        return true;
      }

      window.addEventListener('error', function (event) {
        return handleError(event);
      }, true);

      window.addEventListener('unhandledrejection', function (event) {
        const reason = event && event.reason;
        const stack = typeof reason === 'string' ? reason : (reason && reason.stack) ? reason.stack : '';
        if (isExtensionError(stack) || isExtensionError(String(reason))) {
          event.preventDefault?.();
        }
      }, true);
    })();
  `;

  const swRegisterScript = `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(reg) {
            console.log('PWA ServiceWorker registered successfully');
          },
          function(err) {
            console.log('PWA ServiceWorker registration failed:', err);
          }
        );
      });
    }
  `;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
        <link href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" rel="stylesheet"/>
        <script dangerouslySetInnerHTML={{ __html: extensionGuard }} />
        <script dangerouslySetInnerHTML={{ __html: swRegisterScript }} />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
