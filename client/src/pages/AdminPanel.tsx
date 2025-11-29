import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
import { MapPin, Users, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Ruta {
  id: string;
  nombre: string;
  destino: string;
  precio: number;
  dificultad: string;
  duracion: string;
  resenas: number;
  rating: string;
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

export default function AdminPanel() {
  const { isAuthenticated, isAdmin, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: rutas, isLoading: rutasLoading } = useQuery<Ruta[]>({
    queryKey: ["/api", "rutas"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: reservas, isLoading: reservasLoading } = useQuery<Reserva[]>({
    queryKey: ["/api", "reservas"],
    enabled: isAuthenticated && isAdmin,
  });

  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      setLocation("/");
    }
  }, [authLoading, isAuthenticated, isAdmin, setLocation]);

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

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  const totalRutas = rutas?.length || 0;
  const totalReservas = reservas?.length || 0;
  const reservasConfirmadas = reservas?.filter(r => r.estado === "confirmada").length || 0;
  const ingresoTotal = reservas?.reduce((sum, r) => sum + (r.estado === "confirmada" ? r.totalPagado : 0), 0) || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary/10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Panel de Administración
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestiona rutas y reservas
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Rutas</CardTitle>
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
                <CardTitle className="text-sm font-medium">Confirmadas</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reservasConfirmadas}</div>
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
              <TabsTrigger value="rutas" data-testid="tab-routes">Rutas</TabsTrigger>
              <TabsTrigger value="reservas" data-testid="tab-reservations">Reservas</TabsTrigger>
            </TabsList>

            <TabsContent value="rutas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Todas las Rutas</CardTitle>
                </CardHeader>
                <CardContent>
                  {rutasLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Destino</TableHead>

                          <TableHead>Precio</TableHead>
                          <TableHead>Rating</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rutas?.map((ruta) => (
                          <TableRow key={ruta.id} data-testid={`row-route-${ruta.id}`}>
                            <TableCell className="font-medium">{ruta.nombre}</TableCell>
                            <TableCell>{ruta.destino}</TableCell>
                            <TableCell>
                            </TableCell>
                            <TableCell>${ruta.precio.toLocaleString()}</TableCell>
                            <TableCell>{ruta.rating} ({ruta.resenas})</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reservas" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Todas las Reservas</CardTitle>
                </CardHeader>
                <CardContent>
                  {reservasLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Fecha Tour</TableHead>
                          <TableHead>Personas</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Creada</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reservas?.map((reserva) => (
                          <TableRow key={reserva.id} data-testid={`row-reservation-${reserva.id}`}>
                            <TableCell className="font-mono text-sm">
                              {reserva.id.slice(0, 8)}
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
                        ))}
                      </TableBody>
                    </Table>
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
