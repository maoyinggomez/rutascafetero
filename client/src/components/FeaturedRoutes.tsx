import CardRuta from "./CardRuta";
import salentoImg from "@assets/generated_images/Salento_town_route_destination_5fb0d1a7.png";
import cocoraImg from "@assets/generated_images/Valle_de_Cocora_palms_b0cf6489.png";
import haciendaImg from "@assets/generated_images/Coffee_farm_hacienda_24d7dcc7.png";
import filandiaImg from "@assets/generated_images/Filandia_viewpoint_6d15e32f.png";
import tastingImg from "@assets/generated_images/Coffee_tasting_experience_1273dbb0.png";

const featuredRoutes = [
  {
    id: "1",
    nombre: "Tour Salento y Pueblo Mágico",
    destino: "Salento, Quindío",
    imagen: salentoImg,
    precio: 85000,
    duracion: "8 horas",
    dificultad: "Fácil" as const,
    rating: 4.8,
    resenas: 124,
  },
  {
    id: "2",
    nombre: "Caminata Valle de Cocora",
    destino: "Valle de Cocora",
    imagen: cocoraImg,
    precio: 120000,
    duracion: "6 horas",
    dificultad: "Moderado" as const,
    rating: 4.9,
    resenas: 203,
  },
  {
    id: "3",
    nombre: "Experiencia Cafetera Completa",
    destino: "Hacienda El Ocaso",
    imagen: haciendaImg,
    precio: 95000,
    duracion: "5 horas",
    dificultad: "Fácil" as const,
    rating: 4.7,
    resenas: 156,
  },
  {
    id: "4",
    nombre: "Filandia y Mirador 360°",
    destino: "Filandia, Quindío",
    imagen: filandiaImg,
    precio: 75000,
    duracion: "4 horas",
    dificultad: "Fácil" as const,
    rating: 4.6,
    resenas: 98,
  },
  {
    id: "5",
    nombre: "Cata de Café Premium",
    destino: "Finca Cafetera",
    imagen: tastingImg,
    precio: 65000,
    duracion: "3 horas",
    dificultad: "Fácil" as const,
    rating: 4.9,
    resenas: 187,
  },
  {
    id: "6",
    nombre: "Aventura Cocora Completa",
    destino: "Valle de Cocora",
    imagen: cocoraImg,
    precio: 150000,
    duracion: "1 día",
    dificultad: "Avanzado" as const,
    rating: 4.8,
    resenas: 89,
  },
];

export default function FeaturedRoutes() {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Rutas Destacadas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora nuestras experiencias más populares en el Eje Cafetero
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredRoutes.map((route) => (
            <CardRuta key={route.id} {...route} />
          ))}
        </div>
      </div>
    </section>
  );
}
