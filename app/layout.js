// app/layout.js
import { Poppins } from "next/font/google";
import "./globals.css";
import ClientLayoutWrapper from "./ClientLayoutWrapper";

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-poppins',
});

export const metadata = {
  title: 'CheckMatic',
  description: 'AI-powered News Analysis Platform',
  openGraph: {
    title: 'CheckMatic',
    description: 'Instantly analyze articles, texts, and images for authenticity, bias, and more!',
    url: 'https://www.checkmatic.vercel.app/',
    images: 'https://www.checkmatic.vercel.app/preview-dark.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body
        className={`font-sans ${poppins.className}`}
      >
        <ClientLayoutWrapper>
          {children}
        </ClientLayoutWrapper>
      </body>
    </html>
  );
}