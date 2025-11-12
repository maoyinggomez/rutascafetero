import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Reserva {
  id: string;
  rutaId: string;
  fechaRuta: string;
  cantidadPersonas: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  totalPagado: number;
  createdAt: string;
}

const estadoColors = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmada: "bg-green-100 text-green-800 border-green-200",
  cancelada: "bg-red-100 text-red-800 border-red-200",
};

const estadoLabels = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  cancelada: "Cancelada",
};

export default function Reservas() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: reservas, isLoading } = useQuery<Reserva[]>({
    queryKey: ["/api/reservas/mias"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">Cargando...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary/10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Mis Reservas
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestiona y revisa tus reservas de rutas
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {reservas && reservas.length > 0 ? (
                <div className="space-y-4">
                  {reservas.map((reserva) => (
                    <Card key={reserva.id} data-testid={`card-reservation-${reserva.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div>
                            <CardTitle className="mb-2">Reserva #{reserva.id.slice(0, 8)}</CardTitle>
                            <Badge
                              className={`${estadoColors[reserva.estado]} border`}
                              data-testid={`badge-status-${reserva.id}`}
                            >
                              {estadoLabels[reserva.estado]}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-2xl font-bold text-primary" data-testid={`text-total-${reserva.id}`}>
                              ${reserva.totalPagado.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Fecha del Tour</div>
                              <div className="text-muted-foreground">
                                {format(new Date(reserva.fechaRuta), "PPP", { locale: es })}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Personas</div>
                              <div className="text-muted-foreground">
                                {reserva.cantidadPersonas} {reserva.cantidadPersonas === 1 ? "persona" : "personas"}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">Reservado el</div>
                              <div className="text-muted-foreground">
                                {format(new Date(reserva.createdAt), "PPP", { locale: es })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No tienes reservas</h3>
                    <p className="text-muted-foreground mb-6 text-center">
                      Explora nuestras rutas y haz tu primera reserva
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
