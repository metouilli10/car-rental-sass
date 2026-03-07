import React from "react";
import { CloneLayout } from "@/components/cometly-clone-2/CloneLayout";
import { Navbar } from "@/components/cometly-clone-2/sections/Navbar";
import { Hero } from "@/components/cometly-clone-2/sections/Hero";
import { LogosRow } from "@/components/cometly-clone-2/sections/LogosRow";
import { ScoreSection } from "@/components/cometly-clone-2/sections/ScoreSection";
import { FeaturesGrid } from "@/components/cometly-clone-2/sections/FeaturesGrid";
import { Testimonials } from "@/components/cometly-clone-2/sections/Testimonials";
import { AnalyticsSection } from "@/components/cometly-clone-2/sections/AnalyticsSection";
import { PricingModels } from "@/components/cometly-clone-2/sections/PricingModels";
import { FinalCTA } from "@/components/cometly-clone-2/sections/FinalCTA";
import { Footer } from "@/components/cometly-clone-2/sections/Footer";

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
        <PricingModels />
        <AnalyticsSection />
        <FinalCTA />
      </main>
      <Footer />
    </CloneLayout>
  );
}
