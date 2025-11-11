// Import landing page components
import { Navigation } from "@/components/landing/Navigation";
import { HeroSection } from "@/components/landing/HeroSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { CTASection } from "@/components/landing/CTASection";
import { Footer } from "@/components/landing/Footer";
import { FaqSection } from "@/components/landing/FaqSection";
import { Integrations } from "@/components/landing/Integrations";
import { Testimonials } from "@/components/landing/Testimonials";
import { SecurityPrivacy } from "@/components/landing/SecurityPrivacy";
import { ReplyAssistant } from "@/components/landing/ReplyAssistant";
import { DeepDive } from "@/components/landing/DeepDive";
import { AuthGuard } from "@/components/auth";

export default function LandingPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="min-h-screen bg-gradient-dark text-foreground overflow-hidden">
        {/*  */}
        <Navigation />
        {/*  */}
        <HeroSection />
        {/*  */}
        <StatsSection />
        {/*  */}
        <FeaturesSection />
        {/*  */}
        <LiveDemo />
        {/* How It Works */}
        <HowItWorksSection />
        {/* Deep Dive */}
        <DeepDive />
        {/* Reply Assistant Section */}
        <ReplyAssistant />
        {/* Security & Privacy */}
        <SecurityPrivacy />
        {/* Social Proof / Testimonials */}
        <Testimonials />
        {/* Integrations */}
        <Integrations />
        {/* Pricing Section */}
        <PricingSection />
        {/* FAQ Section */}
        <FaqSection />
        {/* Final CTA Section */}
        <CTASection />
        {/* Footer */}
        <Footer />
      </div>
    </AuthGuard>
  );
}
