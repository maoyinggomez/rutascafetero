import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Star } from "lucide-react";
import { Link } from "wouter";

interface CardRutaProps {
  id: string;
  nombre: string;
  destino: string;
  imagen: string;
  precio: number;
  duracion: string;
  dificultad: "Fácil" | "Moderado" | "Avanzado";
  rating: number;
  resenas: number;
}

const dificultadColors = {
  "Fácil": "bg-green-100 text-green-800 border-green-200",
  "Moderado": "bg-yellow-100 text-yellow-800 border-yellow-200",
  "Avanzado": "bg-red-100 text-red-800 border-red-200",
};

export default function CardRuta({
  id,
  nombre,
  destino,
  imagen,
  precio,
  duracion,
  dificultad,
  rating,
  resenas,
}: CardRutaProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 hover:-translate-y-1 group" data-testid={`card-ruta-${id}`}>
      <div className="relative aspect-video overflow-hidden">
        <img
          src={imagen}
          alt={nombre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 right-3 flex gap-2">

        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg leading-tight" data-testid={`text-route-name-${id}`}>
            {nombre}
          </h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span data-testid={`text-destination-${id}`}>{destino}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{duracion}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
            <span className="text-muted-foreground">({resenas})</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-4 pt-4 border-t">
        <div>
          <div className="text-sm text-muted-foreground">Desde</div>
          <div className="text-2xl font-bold text-primary" data-testid={`text-price-${id}`}>
            ${precio.toLocaleString()}
          </div>
        </div>
        <Link href={`/rutas/${id}`}>
          <Button data-testid={`button-view-details-${id}`}>
            Ver Detalles
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
