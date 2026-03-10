import { Navbar } from "@/components/seline-clone/Navbar";
import { Hero } from "@/components/seline-clone/Hero";
import { Introduction } from "@/components/seline-clone/Introduction";
import { FeaturesGrid } from "@/components/seline-clone/FeaturesGrid";
import { PurposeBuiltSection } from "@/components/seline-clone/PurposeBuiltSection";
import { Footer } from "@/components/seline-clone/Footer";

export default function SelineClonePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] font-sans text-gray-900">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Introduction />
        <FeaturesGrid />
        <PurposeBuiltSection />
      </main>
      <Footer />
    </div>
  );
}
