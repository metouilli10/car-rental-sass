import React from "react";
import { CloneLayout } from "@/components/cometly-clone/CloneLayout";
import { Navbar } from "@/components/cometly-clone/sections/Navbar";
import { Hero } from "@/components/cometly-clone/sections/Hero";
import { LogosRow } from "@/components/cometly-clone/sections/LogosRow";
import { ScoreSection } from "@/components/cometly-clone/sections/ScoreSection";
import { FeaturesGrid } from "@/components/cometly-clone/sections/FeaturesGrid";
import { Testimonials } from "@/components/cometly-clone/sections/Testimonials";
import { AnalyticsSection } from "@/components/cometly-clone/sections/AnalyticsSection";
import { HowItWorks } from "@/components/cometly-clone/sections/HowItWorks";
import { IntegrationsRow } from "@/components/cometly-clone/sections/IntegrationsRow";
import { FinalCTA } from "@/components/cometly-clone/sections/FinalCTA";
import { Footer } from "@/components/cometly-clone/sections/Footer";

export default function CometlyClonePage() {
  return (
    <CloneLayout>
      <Navbar />
      <main>
        <Hero />
        <LogosRow />
        <ScoreSection />
        <FeaturesGrid />
        <Testimonials />
        <AnalyticsSection />
        <HowItWorks />
        <IntegrationsRow />
        <FinalCTA />
      </main>
      <Footer />
    </CloneLayout>
  );
}
