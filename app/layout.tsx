import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MealBrain',
  description: 'An AI sous chef you control - helpful, never bossy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
