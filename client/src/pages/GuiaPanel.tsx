import { useState } from "react";
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RutaForm from "@/components/RutaForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Users, DollarSign, Plus, Trash2, Edit, CheckCircle, XCircle, Clock, Star } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  destino: string;
  precio: number;
  precioPorPersona: number;
  duracion: string;
  duracionMinutos: number;
  cupoMaximo: number;
  resenas: number;
  rating: string;
  disponible: boolean;
  imagenUrl: string;
  anfitrionId: string;
  tags?: string[];
  puntosInteres?: string[];
}

interface Reserva {
  id: string;
  rutaId: string;
  userId: string;
  fechaRuta: string;
  cantidadPersonas: number;
  estado: "pendiente" | "confirmada" | "cancelada" | "cerrada";
  totalPagado: number;
  createdAt: string;
  ruta?: Ruta;
  user?: {
    nombre: string;
    email: string;
  };
}

interface Calificacion {
  id: string;
  reservaId: string;
  rutaId: string;
  rating: number;
  comentario: string;
  createdAt: string;
}

export default function GuiaPanel() {
  const { isAuthenticated, user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const [selectedReservaId, setSelectedReservaId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || user?.rol !== "guia") {
      setLocation("/");
    }
  }, [isAuthenticated, user, setLocation]);

  // Obtener rutas del guía
  const { data: rutas = [], isLoading: rutasLoading } = useQuery<Ruta[]>({
    queryKey: ["/api", "rutas"],
    enabled: !!user?.id,
  });

  const misRutas = rutas.filter((ruta) => ruta.anfitrionId === user?.id);

  // Obtener reservas del guía
  const { data: reservas = [], isLoading: reservasLoading } = useQuery<Reserva[]>({
    queryKey: ["/api", "reservas"],
    enabled: !!user?.id,
  });

  const misReservas = reservas.filter((reserva) => {
    const ruta = rutas.find((r) => r.id === reserva.rutaId);
    return ruta?.anfitrionId === user?.id;
  });

  // Obtener calificaciones de las rutas del guía
  const { data: allCalificaciones = [] } = useQuery<Calificacion[]>({
    queryKey: ["/api/calificaciones", "todas"],
    queryFn: async () => {
      const response = await fetch("/api/calificaciones");
      if (!response.ok) throw new Error("Failed to fetch calificaciones");
      return response.json();
    },
  });

  const misCalificaciones = allCalificaciones.filter((cal) => {
    const ruta = misRutas.find((r) => r.id === cal.rutaId);
    return !!ruta;
  });

  const handleDeleteRuta = async (rutaId: string) => {
    try {
      const response = await fetch(`/api/rutas/${rutaId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Error al eliminar ruta");

      toast({
        title: "Ruta eliminada",
        description: "La ruta ha sido eliminada correctamente",
      });

      queryClient.invalidateQueries({ queryKey: ["/api", "rutas"] });
      setDeleteConfirmation(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la ruta",
        variant: "destructive",
      });
    }
  };

  const handleConfirmReserva = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/reservas/${reservaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "confirmada" }),
      });

      if (!response.ok) throw new Error("Error al confirmar reserva");

      toast({
        title: "Reserva confirmada",
        description: "La reserva ha sido confirmada",
      });

      queryClient.invalidateQueries({ queryKey: ["/api", "reservas"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo confirmar la reserva",
        variant: "destructive",
      });
    }
  };

  const handleRejectReserva = async (reservaId: string) => {
    try {
      const response = await fetch(`/api/reservas/${reservaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelada" }),
      });

      if (!response.ok) throw new Error("Error al rechazar reserva");

      toast({
        title: "Reserva rechazada",
        description: "La reserva ha sido rechazada",
      });

      queryClient.invalidateQueries({ queryKey: ["/api", "reservas"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo rechazar la reserva",
        variant: "destructive",
      });
    }
  };

  const getReservasByRuta = (rutaId: string) => {
    return misReservas.filter((r) => r.rutaId === rutaId);
  };

  const calculatePromedioRating = (rutaId: string) => {
    const ratings = misCalificaciones
      .filter((c) => c.rutaId === rutaId)
      .map((c) => c.rating);

    if (ratings.length === 0) return 0;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Panel del Guía</h1>
          <p className="text-gray-600">Gestiona tus experiencias guiadas y reservas</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Experiencias</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{misRutas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Reservas Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{misReservas.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Ingresos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${misReservas
                  .filter((r) => r.estado === "confirmada")
                  .reduce((sum, r) => sum + r.totalPagado, 0)
                  .toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Calificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-1">
                {misCalificaciones.length > 0
                  ? (
                    misCalificaciones.reduce((sum, c) => sum + c.rating, 0) /
                    misCalificaciones.length
                  ).toFixed(1)
                  : "0"}
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="rutas" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rutas">Mis Experiencias</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="calificaciones">Calificaciones</TabsTrigger>
          </TabsList>

          {/* Tab: Rutas */}
          <TabsContent value="rutas">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Mis Experiencias Guiadas</CardTitle>
                  <Button onClick={() => setShowForm(!showForm)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Nueva Experiencia
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {showForm && (
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <RutaForm
                      initialData={editingRuta || undefined}
                      onSuccess={() => {
                        setShowForm(false);
                        setEditingRuta(null);
                        queryClient.invalidateQueries({ queryKey: ["/api", "rutas"] });
                      }}
                    />
                  </div>
                )}

                {rutasLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : misRutas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tienes experiencias guiadas aún</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {misRutas.map((ruta) => (
                      <div key={ruta.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="aspect-video rounded-lg overflow-hidden mb-3 bg-gray-200">
                          <img
                            src={ruta.imagenUrl || "/placeholder.jpg"}
                            alt={ruta.nombre}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">{ruta.nombre}</h3>
                        <div className="space-y-2 mb-3 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {ruta.destino}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {ruta.duracion}
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {getReservasByRuta(ruta.id).length} reservas
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            ${ruta.precioPorPersona.toLocaleString()}
                          </div>
                          <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            {calculatePromedioRating(ruta.id)} ({misCalificaciones.filter((c) => c.rutaId === ruta.id).length} reseñas)
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingRuta(ruta);
                              setShowForm(true);
                            }}
                            className="gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setDeleteConfirmation(ruta.id)}
                            className="gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Reservas */}
          <TabsContent value="reservas">
            <Card>
              <CardHeader>
                <CardTitle>Reservas de mis Experiencias</CardTitle>
              </CardHeader>
              <CardContent>
                {reservasLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : misReservas.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tienes reservas aún</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Experiencia</TableHead>
                          <TableHead>Turista</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {misReservas.map((reserva) => (
                          <TableRow key={reserva.id}>
                            <TableCell className="font-medium">{reserva.ruta?.nombre}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium">{reserva.user?.nombre}</p>
                                <p className="text-sm text-gray-500">{reserva.user?.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {format(new Date(reserva.fechaRuta), "dd MMM yyyy", {
                                locale: es,
                              })}
                            </TableCell>
                            <TableCell>{reserva.cantidadPersonas}</TableCell>
                            <TableCell>${reserva.totalPagado.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  reserva.estado === "confirmada"
                                    ? "default"
                                    : reserva.estado === "pendiente"
                                    ? "secondary"
                                    : "destructive"
                                }
                              >
                                {reserva.estado}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {reserva.estado === "pendiente" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleConfirmReserva(reserva.id)}
                                    className="gap-1"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Confirmar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectReserva(reserva.id)}
                                    className="gap-1"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Rechazar
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Calificaciones */}
          <TabsContent value="calificaciones">
            <Card>
              <CardHeader>
                <CardTitle>Calificaciones y Reseñas</CardTitle>
              </CardHeader>
              <CardContent>
                {misCalificaciones.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tienes calificaciones aún</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {misCalificaciones.map((cal) => (
                      <div
                        key={cal.id}
                        className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 ${
                                  i < cal.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm text-gray-500">
                            {format(new Date(cal.createdAt), "dd MMM yyyy", {
                              locale: es,
                            })}
                          </span>
                        </div>
                        <p className="text-gray-700">
                          <strong>Experiencia:</strong> {misRutas.find((r) => r.id === cal.rutaId)?.nombre}
                        </p>
                        {cal.comentario && (
                          <p className="text-gray-600 mt-2 italic">"{cal.comentario}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Experiencia</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta experiencia? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmation(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmation && handleDeleteRuta(deleteConfirmation)}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
