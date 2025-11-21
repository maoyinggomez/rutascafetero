import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Users, Star } from "lucide-react";



interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  destino: string;
  dificultad: string;
  duracion: string;
  precio: number;
  imagenUrl: string;
  cupoMaximo: number;
  rating: string;
  resenas: number;
  precioPorPersona: number;
  puntosInteres: string[] | null;
  tags: string[] | null;
}

export default function RutaDetalle() {
  const [, params] = useRoute("/rutas/:id");
  const [, setLocation] = useLocation();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [fechaRuta, setFechaRuta] = useState("");
  const [cantidadPersonas, setCantidadPersonas] = useState(1);

  const { data: ruta, isLoading } = useQuery<Ruta>({
    queryKey: ["/api", "rutas", params?.id],
    enabled: !!params?.id,
  });

  const reservaMutation = useMutation({
      mutationFn: async (data: {
        rutaId: string;
        userId: string;
        fechaRuta: string;
        cantidadPersonas: number;
        totalPagado: number;
      }) => {
        return apiRequest("POST", "/api/reservas", data);
      },
      onSuccess: () => {
        toast({
          title: "¡Reserva creada!",
          description: "Pendiente de confirmación por parte del anfitrión",
        });
        queryClient.invalidateQueries({ queryKey: ["/api", "reservas"] });
        setLocation("/reservas");
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "No se pudo crear la reserva",
          variant: "destructive",
        });
      },
    });

const handleReservar = (e: React.FormEvent) => {
  e.preventDefault();

  if (!isAuthenticated) {
    toast({
      title: "Inicia sesión",
      description: "Debes iniciar sesión para hacer una reserva",
      variant: "destructive",
    });
    setLocation("/login");
    return;
  }

  if (!fechaRuta) {
    toast({
      title: "Fecha requerida",
      description: "Por favor selecciona una fecha para tu reserva",
      variant: "destructive",
    });
    return;
  }

  if (!ruta) return;

  const precioUnitario = ruta.precioPorPersona || ruta.precio;

  // 👇 Este es el cambio importante
  reservaMutation.mutate({
    rutaId: ruta.id,
    userId: user?.id ?? "", // ✅ ahora se envía el usuario logueado
    fechaRuta: fechaRuta,
 // ✅ formato string ISO correcto
    cantidadPersonas: Number(cantidadPersonas),
    totalPagado: precioUnitario * cantidadPersonas,
  });
};

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Skeleton className="h-96 w-full mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-40" />
              </div>
              <Skeleton className="h-96" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!ruta) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Ruta no encontrada</h1>
            <Button onClick={() => setLocation("/rutas")}>
              Ver todas las rutas
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const precioUnitario = ruta.precioPorPersona || ruta.precio;
  const total = precioUnitario * cantidadPersonas;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="relative h-96 overflow-hidden">
          <img
            src={ruta.imagenUrl}
            alt={ruta.nombre}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge>{ruta.dificultad}</Badge>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{ruta.rating}</span>
                    <span className="text-muted-foreground">({ruta.resenas} reseñas)</span>
                  </div>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-route-title">
                  {ruta.nombre}
                </h1>

                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{ruta.destino}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>{ruta.duracion}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    <span>Hasta {ruta.cupoMaximo} personas</span>
                  </div>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Descripción</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed whitespace-pre-line">
                    {ruta.descripcion}
                  </p>
                </CardContent>
              </Card>

              {ruta.puntosInteres && ruta.puntosInteres.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Puntos de Interés</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {ruta.puntosInteres.map((punto, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          <span className="leading-relaxed">{punto}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {ruta.tags && ruta.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-3">Características</h3>
                  <div className="flex flex-wrap gap-2">
                    {ruta.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>Reservar Ruta</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleReservar} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fecha">Fecha</Label>
                      <Input
                        id="fecha"
                        type="date"
                        value={fechaRuta}
                        onChange={(e) => setFechaRuta(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        data-testid="input-booking-date"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="personas">Cantidad de Personas</Label>
                      <Input
                        id="personas"
                        type="number"
                        min="1"
                        max={ruta.cupoMaximo}
                        value={cantidadPersonas}
                        onChange={(e) => setCantidadPersonas(parseInt(e.target.value))}
                        required
                        data-testid="input-booking-quantity"
                      />
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-muted-foreground">Precio por persona</span>
                        <span className="font-medium" data-testid="text-price-per-person">
                          ${precioUnitario.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-lg">Total</span>
                        <span className="font-bold text-2xl text-primary" data-testid="text-booking-total">
                          ${total.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={reservaMutation.isPending}
                      data-testid="button-submit-booking"
                    >
                      {reservaMutation.isPending ? "Reservando..." : "Reservar Ahora"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
