import { MotionConfig } from 'framer-motion';
import './globals.css';
import SmoothScroll from '@/components/SmoothScroll';
import PageIntro from '@/components/PageIntro';

export const metadata = {
  title: 'BluNeuron J500 — True 500 ANSI Lumens, Built-in Google TV',
  description:
    'The BluNeuron J500 projector: true 500 ANSI Lumens, native 1080P, Allwinner H723 chipset, and built-in Google TV with 10,000+ apps.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-black font-sans text-white antialiased">
        <MotionConfig reducedMotion="user">
          <SmoothScroll />
          <PageIntro />
          {children}
        </MotionConfig>
      </body>
    </html>
  );
}
