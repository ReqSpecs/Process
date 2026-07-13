import { Hero } from "@/components/marketing/Hero";
import { BrandStrip } from "@/components/marketing/BrandStrip";
import { RolesSection } from "@/components/marketing/RolesSection";
import { CaptureSection } from "@/components/marketing/CaptureSection";
import { ImproveSection } from "@/components/marketing/ImproveSection";
import { AutomateSection } from "@/components/marketing/AutomateSection";

export default function HomePage() {
  return (
    <>
      {/* hero + brand strip fill the first viewport exactly (nav is 64px),
          so the strip's bottom edge is pinned to the fold. White like Notion;
          the sections after inherit the grey page background. */}
      <div className="flex min-h-[calc(100svh-64px)] flex-col bg-surface">
        <div className="flex flex-1 flex-col justify-center">
          <Hero />
        </div>
        <BrandStrip />
      </div>
      {/* white/grey rhythm: hero white -> capture grey -> improve white ->
          automate grey -> built-for + final CTA white */}
      <CaptureSection />
      <ImproveSection />
      <AutomateSection />
      <RolesSection />
    </>
  );
}
