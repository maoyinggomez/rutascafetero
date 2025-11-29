import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RatingModal from "@/components/RatingModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar, MapPin, Users, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Reserva {
  id: string;
  rutaId: string;
  fechaRuta: string;
  cantidadPersonas: number;
  estado: "pendiente" | "confirmada" | "cancelada";
  totalPagado: number;
  horaInicio?: string;
  horaFin?: string;
  createdAt: string;
}

interface RutaInfo {
  id: string;
  nombre: string;
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);
  const [rutaInfo, setRutaInfo] = useState<RutaInfo | null>(null);

  const { data: reservas, isLoading } = useQuery<Reserva[]>({
    queryKey: ["/api/reservas/mias"],
    enabled: isAuthenticated,
  });

  const cancelarReservaMutation = useMutation({
    mutationFn: async (reservaId: string) => {
      return apiRequest("DELETE", `/api/reservas/${reservaId}`);
    },
    onSuccess: () => {
      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reservas/mias"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo cancelar la reserva",
        variant: "destructive",
      });
    },
  });

  const crearCalificacionMutation = useMutation({
    mutationFn: async ({
      reservaId,
      rutaId,
      rating,
      comentario,
    }: {
      reservaId: string;
      rutaId: string;
      rating: number;
      comentario: string;
    }) => {
      return apiRequest("POST", "/api/calificaciones", {
        reservaId,
        rutaId,
        rating,
        comentario,
      });
    },
    onSuccess: () => {
      toast({
        title: "Calificación enviada",
        description: "Gracias por tu opinión, ayuda a otros viajeros",
      });
      setRatingModalOpen(false);
      setSelectedReservaId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/reservas/mias"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar la calificación",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const isReservationEnded = (reserva: Reserva): boolean => {
    if (!reserva.horaFin || reserva.estado !== "confirmada") {
      return false;
    }

    const [hours, minutes] = reserva.horaFin.split(":").map(Number);
    const endTime = new Date(reserva.fechaRuta);
    endTime.setHours(hours, minutes, 0, 0);

    return new Date() > endTime;
  };

  const openRatingModal = async (reserva: Reserva) => {
    try {
      // Verificar si la experiencia ya terminó
      if (!isReservationEnded(reserva)) {
        toast({
          title: "Experiencia no terminada",
          description: "Solo puedes calificar después de que termine la experiencia",
        });
        return;
      }

      // Verificar si ya existe calificación
      try {
        const existing = await apiRequest(
          "GET",
          `/api/calificaciones/reserva/${reserva.id}`
        );

        if (existing) {
          toast({
            title: "Ya calificaste",
            description: "Ya has calificado esta experiencia",
          });
          return;
        }
      } catch (error) {
        // Si el endpoint falla, continuamos (podría ser un error temporal)
        console.error("Error verificando calificación anterior:", error);
      }

      // Obtener info de la ruta
      const ruta = await apiRequest("GET", `/api/rutas/${reserva.rutaId}`);
      setRutaInfo(ruta);
      setSelectedReservaId(reserva.id);
      setRatingModalOpen(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo abrir el formulario de calificación",
        variant: "destructive",
      });
    }
  };

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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
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

                        {(reserva.horaInicio || reserva.horaFin) && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-blue-600" />
                              <div>
                                <div className="font-medium text-blue-900">Horario del Tour</div>
                                <div className="text-blue-700">
                                  {reserva.horaInicio} {reserva.horaFin && `- ${reserva.horaFin}`}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {isReservationEnded(reserva) && (
                          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 text-sm">
                              <AlertCircle className="h-4 w-4 text-green-600" />
                              <div>
                                <div className="font-medium text-green-900">Tu experiencia ha terminado</div>
                                <div className="text-green-700 text-xs">
                                  Califica tu experiencia para ayudar a otros viajeros
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="pt-4 border-t flex gap-2 flex-wrap">
                          {isReservationEnded(reserva) && (
                            <Button
                              onClick={() => openRatingModal(reserva)}
                              className="bg-green-600 text-white hover:bg-green-700"
                              size="sm"
                              disabled={crearCalificacionMutation.isPending}
                            >
                              ⭐ Calificar Experiencia
                            </Button>
                          )}
                          
                          {reserva.estado === "pendiente" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  disabled={cancelarReservaMutation.isPending}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancelar Reserva
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción cancelará tu reserva. Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, mantener reserva</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => cancelarReservaMutation.mutate(reserva.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Sí, cancelar reserva
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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

      <RatingModal
        open={ratingModalOpen}
        onOpenChange={setRatingModalOpen}
        rutaNombre={rutaInfo?.nombre}
        isLoading={crearCalificacionMutation.isPending}
        onSubmit={async (rating, comentario) => {
          if (selectedReservaId && rutaInfo) {
            await crearCalificacionMutation.mutateAsync({
              reservaId: selectedReservaId,
              rutaId: rutaInfo.id,
              rating,
              comentario,
            });
          }
        }}
      />

      <Footer />
    </div>
  );
}
