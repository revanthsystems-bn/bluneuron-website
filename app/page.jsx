import AnnouncementBar from '@/components/AnnouncementBar';
import Header from '@/components/Header';
import TrustBadges from '@/components/TrustBadges';
import LifestyleShowcase from '@/components/LifestyleShowcase';
import Highlights from '@/components/Highlights';
import LensZoom from '@/components/LensZoom';
import TechSpecs from '@/components/TechSpecs';
import VideoPlayer from '@/components/VideoPlayer';
import ComparisonTable from '@/components/ComparisonTable';
import Showroom from '@/components/Showroom';
import Newsletter from '@/components/Newsletter';
import Footer from '@/components/Footer';
import NewsletterPopup from '@/components/NewsletterPopup';

export default function Home() {
  return (
    <>
      <AnnouncementBar />
      <Header />
      <main>
        <Showroom />
        <TrustBadges />
        <LifestyleShowcase />
        <Highlights />
        <LensZoom />
        <TechSpecs />
        <VideoPlayer />
        <ComparisonTable />
        <Newsletter />
      </main>
      <Footer />
      <NewsletterPopup />
    </>
  );
}
