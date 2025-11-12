import { useQuery } from "@tanstack/react-query";
import CardRuta from "./CardRuta";
import type { Ruta } from "@shared/schema";

export default function FeaturedRoutes() {
  const { data: rutas = [], isLoading } = useQuery<Ruta[]>({
    queryKey: ["/api/rutas"],
  });

  const featuredRoutes = rutas.slice(0, 6);

  if (isLoading) {
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
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 bg-muted animate-pulse rounded-md"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

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
          {featuredRoutes.map((ruta) => (
            <CardRuta
              key={ruta.id}
              id={ruta.id}
              nombre={ruta.nombre}
              destino={ruta.destino}
              imagen={ruta.imagenUrl}
              precio={ruta.precioPorPersona}
              duracion={ruta.duracion}
              dificultad={ruta.dificultad}
              rating={parseFloat(ruta.rating)}
              resenas={ruta.resenas}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
