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
import { MapPin, Users, DollarSign, Plus, Trash2, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
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
  dificultad: string;
  duracion: string;
  duracionHoras: number;
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
  estado: "pendiente" | "confirmada" | "cancelada";
  totalPagado: number;
  createdAt: string;
}

const estadoColors = {
  pendiente: "bg-yellow-100 text-yellow-800 border-yellow-200",
  confirmada: "bg-green-100 text-green-800 border-green-200",
  cancelada: "bg-red-100 text-red-800 border-red-200",
};

export default function AnfitrionPanel() {
  const { isAuthenticated, user, isLoading: authLoading, isAnfitrion } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRuta, setEditingRuta] = useState<Ruta | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { 
    data: misRutas, 
    isLoading: rutasLoading,
    refetch: refetchRutas 
  } = useQuery<Ruta[]>({
    queryKey: ["/api", "rutas"],
    enabled: isAuthenticated && isAnfitrion,
  });

  const { data: reservasDeRutas, isLoading: reservasLoading } = useQuery<Reserva[]>({
    queryKey: ["/api", "reservas"],
    enabled: isAuthenticated && isAnfitrion,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAnfitrion)) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, isAnfitrion, setLocation]);

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

  if (!isAuthenticated || !isAnfitrion) {
    return null;
  }

  // Filtrar solo rutas del anfitrión actual
  const misRutasFiltradas = misRutas?.filter(r => r.anfitrionId === user?.id) || [];
  
  // Filtrar reservas de mis rutas
  const misReservas = reservasDeRutas?.filter(r => 
    misRutasFiltradas.some(ruta => ruta.id === r.rutaId)
  ) || [];

  const totalRutas = misRutasFiltradas.length;
  const totalReservas = misReservas.length;
  const reservasConfirmadas = misReservas.filter(r => r.estado === "confirmada").length;
  const reservasPendientes = misReservas.filter(r => r.estado === "pendiente").length;
  const ingresoTotal = misReservas
    .filter(r => r.estado === "confirmada")
    .reduce((sum, r) => sum + r.totalPagado, 0);

  const handleDeleteRuta = async (rutaId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta ruta?")) {
      return;
    }

    try {
      setDeletingId(rutaId);
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/rutas/${rutaId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al eliminar ruta");
      }

      toast({
        title: "Éxito",
        description: "Ruta eliminada correctamente",
      });

      refetchRutas();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditRuta = (ruta: Ruta) => {
    setEditingRuta(ruta);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRuta(null);
  };

  const handleOpenChangeForm = (open: boolean) => {
    if (!open) {
      handleCloseForm();
    } else {
      setIsFormOpen(true);
    }
  };

  const handleActualizarReserva = async (reservaId: string, nuevoEstado: "confirmada" | "cancelada") => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/reservas/${reservaId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar reserva");
      }

      toast({
        title: "Éxito",
        description: nuevoEstado === "confirmada" ? "Reserva confirmada" : "Reserva cancelada",
      });

      // Refetch reservas
      queryClient.invalidateQueries({ queryKey: ["/api", "reservas"] });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="bg-primary/10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Panel de Anfitrión
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestiona tus rutas y reservas
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mis Rutas</CardTitle>
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalRutas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalReservas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{reservasPendientes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{reservasConfirmadas}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${ingresoTotal.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="rutas" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rutas">Mis Rutas</TabsTrigger>
              <TabsTrigger value="pendientes" className="relative">
                Pendientes
                {reservasPendientes > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">
                    {reservasPendientes}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="reservas">Todas las Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="rutas" className="space-y-4">
              <div className="flex justify-end mb-4">
                <RutaForm 
                  rutaToEdit={editingRuta}
                  isOpen={isFormOpen}
                  onOpenChange={handleOpenChangeForm}
                  onSuccess={() => {
                    refetchRutas();
                    handleCloseForm();
                  }}
                />
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tus Rutas</CardTitle>
                </CardHeader>
                <CardContent>
                  {rutasLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : misRutasFiltradas.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">No tienes rutas aún</p>
                      <RutaForm 
                        rutaToEdit={null}
                        isOpen={isFormOpen}
                        onOpenChange={handleOpenChangeForm}
                        onSuccess={() => {
                          refetchRutas();
                          handleCloseForm();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {misRutasFiltradas.map((ruta) => (
                        <div 
                          key={ruta.id} 
                          className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition"
                        >
                          {ruta.imagenUrl && (
                            <img 
                              src={ruta.imagenUrl} 
                              alt={ruta.nombre}
                              className="h-24 w-32 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-semibold text-lg">{ruta.nombre}</h3>
                                <p className="text-sm text-muted-foreground">{ruta.destino}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditRuta(ruta)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteRuta(ruta.id)}
                                  disabled={deletingId === ruta.id}
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex gap-4 text-sm">
                              <div>
                                <Badge variant="secondary">{ruta.dificultad}</Badge>
                              </div>
                              <div>
                                <span className="font-medium">${ruta.precioPorPersona.toLocaleString()}</span>
                                <span className="text-muted-foreground"> por persona</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">{ruta.duracionHoras}h</span>
                              </div>
                              <div>
                                <Badge variant={ruta.disponible ? "default" : "secondary"}>
                                  {ruta.disponible ? "Disponible" : "No disponible"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pendientes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reservas Pendientes de Confirmación</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservasLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : misReservas.filter(r => r.estado === "pendiente").length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay reservas pendientes
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {misReservas.filter(r => r.estado === "pendiente").map((reserva) => {
                        const ruta = misRutasFiltradas.find(r => r.id === reserva.rutaId);
                        return (
                          <div 
                            key={reserva.id} 
                            className="border rounded-lg p-4 hover:bg-muted/50 transition"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h3 className="font-semibold">{ruta?.nombre || "Ruta desconocida"}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(reserva.fechaRuta), "dd/MM/yyyy")} - {reserva.cantidadPersonas} personas
                                </p>
                              </div>
                              <span className="text-lg font-bold text-primary">
                                ${reserva.totalPagado.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleActualizarReserva(reserva.id, "confirmada")}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => {
                                  if (confirm("¿Está seguro de rechazar esta reserva?")) {
                                    handleActualizarReserva(reserva.id, "cancelada");
                                  }
                                }}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rechazar
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Todas tus Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservasLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : misReservas.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No hay reservas aún
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID Ruta</TableHead>
                            <TableHead>Fecha Tour</TableHead>
                            <TableHead>Personas</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Creada</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {misReservas.map((reserva) => {
                            const ruta = misRutasFiltradas.find(r => r.id === reserva.rutaId);
                            return (
                              <TableRow key={reserva.id}>
                                <TableCell className="font-mono text-sm">
                                  {ruta?.nombre || reserva.rutaId.slice(0, 8)}
                                </TableCell>
                                <TableCell>
                                  {format(new Date(reserva.fechaRuta), "dd/MM/yyyy")}
                                </TableCell>
                                <TableCell>{reserva.cantidadPersonas}</TableCell>
                                <TableCell>${reserva.totalPagado.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Badge className={`${estadoColors[reserva.estado]} border`}>
                                    {reserva.estado}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {format(new Date(reserva.createdAt), "dd/MM/yyyy")}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
