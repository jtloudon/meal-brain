import type { Metadata, Viewport } from 'next';
import './globals.css';
import SplashScreen from './components/SplashScreen';

export const metadata: Metadata = {
  title: 'MealBrain',
  description: 'An AI sous chef you control - helpful, never bossy',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <SplashScreen />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Remove Next.js dev indicator
              if (typeof window !== 'undefined') {
                const removeIndicator = () => {
                  const selectors = [
                    '#devtools-indicator',
                    '[data-nextjs-toast]',
                    'nextjs-portal'
                  ];
                  selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => el.remove());
                  });
                };
                removeIndicator();
                setInterval(removeIndicator, 1000);
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
