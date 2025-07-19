import { Button } from "@/components/ui/button";
import { Rocket, BookOpen } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary via-accent to-secondary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
          Ready to Build And Multiply Together?
        </h2>
        <p className="text-xl text-white opacity-90 mb-8 max-w-3xl mx-auto">
          Join the BAM community today where we build and multiply wealth together through collective DeFi strategies and shared prosperity.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            className="bg-white text-primary px-8 py-4 rounded-full font-semibold text-lg hover:shadow-lg transition-all duration-300 hover:transform hover:scale-105"
            onClick={() => window.open("https://apex.bam-ecosystem.com", "_blank")}
          >
            <Rocket className="mr-2 h-5 w-5" />
            Get Started
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="border-2 bg-white/10 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-primary transition-all duration-300"
            style={{ borderColor: 'white' }}
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Read Whitepaper
          </Button>
        </div>
      </div>
    </section>
  );
}
