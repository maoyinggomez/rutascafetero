import { Link } from "wouter";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedRoutes from "@/components/FeaturedRoutes";
import WhyChooseUs from "@/components/WhyChooseUs";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import coffeePattern from "@assets/generated_images/Coffee_cherries_harvest_0c853251.png";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <Hero />
        <FeaturedRoutes />
        <WhyChooseUs />
        
        <section
          className="py-20 bg-primary/5 relative overflow-hidden"
          style={{
            backgroundImage: `url(${coffeePattern})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-background/90" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              ¿Listo para tu Aventura?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Explora más de 50 rutas únicas en el Eje Cafetero. Reserva hoy y
              vive una experiencia inolvidable rodeado de café, naturaleza y cultura.
            </p>
            <Link href="/rutas">
              <Button size="lg" data-testid="button-explore-routes">
                Explorar Todas las Rutas
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
