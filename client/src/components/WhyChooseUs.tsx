import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Award, DollarSign } from "lucide-react";
import guideImg from "@assets/generated_images/Coffee_farmer_guide_79da7c34.png";

const features = [
  {
    icon: Users,
    title: "Guías Expertos",
    description: "Guías locales certificados con amplio conocimiento de la región",
  },
  {
    icon: Award,
    title: "Experiencias Auténticas",
    description: "Vive el café de Colombia como un verdadero caficultor",
  },
  {
    icon: Shield,
    title: "Seguridad Primero",
    description: "Todos nuestros tours cumplen con estándares de seguridad",
  },
  {
    icon: DollarSign,
    title: "Mejores Precios",
    description: "Garantizamos las tarifas más competitivas del mercado",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            ¿Por Qué Elegirnos?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tu experiencia en el Eje Cafetero es nuestra prioridad
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover-elevate transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="rounded-lg bg-primary/10 w-12 h-12 flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="relative">
            <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-xl">
              <img
                src={guideImg}
                alt="Guía local del Eje Cafetero"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
