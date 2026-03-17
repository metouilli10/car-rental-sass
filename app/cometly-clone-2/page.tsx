import React from "react";
import { CloneLayout } from "@/components/cometly-clone-2/CloneLayout";
import { Navbar } from "@/components/cometly-clone-2/sections/Navbar";
import { Hero } from "@/components/cometly-clone-2/sections/Hero";
import { LogosRow } from "@/components/cometly-clone-2/sections/LogosRow";
import { ScoreSection } from "@/components/cometly-clone-2/sections/ScoreSection";
import { WorkflowGallery } from "@/components/cometly-clone-2/sections/WorkflowGallery";
import { FeaturesGrid } from "@/components/cometly-clone-2/sections/FeaturesGrid";
import { Testimonials } from "@/components/cometly-clone-2/sections/Testimonials";
import { PricingModels } from "@/components/cometly-clone-2/sections/PricingModels";
import { Footer } from "@/components/cometly-clone-2/sections/Footer";
import { WhatsAppWidget } from "@/components/cometly-clone-2/sections/WhatsAppWidget";
import { FAQAccordionBlock } from "@/components/ui/faq-accordion-block-shadcnui";

export function LandingPage() {
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
        <WorkflowGallery />
        <FAQAccordionBlock />
      </main>
      <Footer />
      <WhatsAppWidget />
    </CloneLayout>
  );
}

export default function CometlyClonePage() {
  return <LandingPage />;
}
