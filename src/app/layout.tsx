import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

const appTitle = 'PyCoder: AI-Powered Python Code Editor & Assistant';
const appDescription = 'Write, run, and debug Python code with an AI assistant. Generate test cases, add comments, and get code suggestions with the power of Gemini.';

export const metadata: Metadata = {
  title: appTitle,
  description: appDescription,
  keywords: ['Python', 'code editor', 'AI assistant', 'Gemini', 'code generation', 'test cases', 'Python runner'],
  openGraph: {
    title: appTitle,
    description: appDescription,
    type: 'website',
    images: [
      {
        url: 'https://picsum.photos/seed/pycoder/1200/630',
        width: 1200,
        height: 630,
        alt: 'AI-Powered Python Code Editor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: appTitle,
    description: appDescription,
    images: ['https://picsum.photos/seed/pycoder/1200/630'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: appTitle,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    description: appDescription,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
