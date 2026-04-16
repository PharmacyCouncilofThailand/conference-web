import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getEvents } from '@/lib/services';
import { HeroSection } from '@/components/home/HeroSection';
import { StatsSection } from '@/components/home/StatsSection';
import { FeaturedEvents } from '@/components/home/FeaturedEvents';
import { CPEBenefits } from '@/components/home/CPEBenefits';
import { TrustBadges } from '@/components/home/TrustBadges';
import { CTASection } from '@/components/home/CTASection';
import { HOME_STATS } from '@/config/constants';

export const revalidate = 60;

export default async function Home() {
  const events = await getEvents().catch(() => []);
  const upcomingEvents = events;

  // Stats Data
  const stats = {
    yearsCount: HOME_STATS.YEARS_COUNT,
    membersCount: HOME_STATS.MEMBERS_COUNT,
    eventsCount: HOME_STATS.EVENTS_COUNT,
    cpeCount: HOME_STATS.CPE_COUNT
  };

  return (
    <div className="min-h-screen bg-white text-[#737300] overflow-x-hidden">
      <Navbar />

      <HeroSection
        yearsCount={stats.yearsCount}
        membersCount={stats.membersCount}
        eventsCount={stats.eventsCount}
        featuredEvent={upcomingEvents[0]}
        events={upcomingEvents}
      />

      <TrustBadges />

      <FeaturedEvents events={upcomingEvents} />

      <CPEBenefits />

      <StatsSection {...stats} />

      <CTASection />

      <Footer />
    </div>
  );
}
