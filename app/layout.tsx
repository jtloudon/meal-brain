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
      </body>
    </html>
  );
}
