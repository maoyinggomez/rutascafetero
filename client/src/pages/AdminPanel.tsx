import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MapPin, Users, DollarSign, Calendar, ShieldAlert } from "lucide-react";
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
  oculta?: boolean;
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

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  suspendido: boolean;
  motivoSuspension?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalles: string;
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
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [motivoSuspension, setMotivoSuspension] = useState("");

  const { data: rutas, isLoading: rutasLoading } = useQuery<Ruta[]>({
    queryKey: ["/api", "rutas"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: reservas, isLoading: reservasLoading } = useQuery<Reserva[]>({
    queryKey: ["/api", "reservas"],
    enabled: isAuthenticated && isAdmin,
  });

  const { data: usuarios, isLoading: usuariosLoading } = useQuery<Usuario[]>({
    queryKey: ["/api/admin", "usuarios"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/usuarios");
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });

  const { data: auditLogs, isLoading: auditLogsLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/admin", "audit-logs"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/audit-logs");
      return response;
    },
    enabled: isAuthenticated && isAdmin,
  });

  // Mutación para suspender usuario
  const suspenderMutation = useMutation({
    mutationFn: async ({ userId, motivo }: { userId: string; motivo: string }) => {
      console.log("🔵 Suspendiendo usuario:", userId, "Motivo:", motivo);
      return await apiRequest("PUT", `/api/admin/usuarios/${userId}/suspender`, { motivo });
    },
    onSuccess: () => {
      console.log("✅ Usuario suspendido");
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "audit-logs"] });
      setShowSuspendDialog(false);
      setMotivoSuspension("");
      setSelectedUser(null);
    },
    onError: (error) => {
      console.error("❌ Error al suspender:", error);
    },
  });

  // Mutación para restaurar usuario
  const restaurarMutation = useMutation({
    mutationFn: async (userId: string) => {
      console.log("🔵 Restaurando usuario:", userId);
      return await apiRequest("PUT", `/api/admin/usuarios/${userId}/restaurar`, {});
    },
    onSuccess: () => {
      console.log("✅ Usuario restaurado");
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "audit-logs"] });
    },
    onError: (error) => {
      console.error("❌ Error al restaurar:", error);
    },
  });

  // Mutación para cambiar rol
  const cambiarRolMutation = useMutation({
    mutationFn: async ({ userId, nuevoRol }: { userId: string; nuevoRol: string }) => {
      console.log("🔵 Cambiando rol:", userId, "a:", nuevoRol);
      return await apiRequest("PUT", `/api/admin/usuarios/${userId}/validar-rol`, { nuevoRol });
    },
    onSuccess: () => {
      console.log("✅ Rol cambiado");
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "usuarios"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "audit-logs"] });
    },
    onError: (error) => {
      console.error("❌ Error al cambiar rol:", error);
    },
  });

  // Mutación para ocultar ruta
  const ocultarRutaMutation = useMutation({
    mutationFn: async (rutaId: string) => {
      console.log("🔵 Ocultando ruta:", rutaId);
      return await apiRequest("PUT", `/api/admin/rutas/${rutaId}/ocultar`, {});
    },
    onSuccess: () => {
      console.log("✅ Ruta ocultada");
      queryClient.invalidateQueries({ queryKey: ["/api", "rutas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin", "audit-logs"] });
    },
    onError: (error) => {
      console.error("❌ Error al ocultar ruta:", error);
    },
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
              Gestiona rutas, reservas, usuarios y seguridad
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
              <TabsTrigger value="rutas">Rutas</TabsTrigger>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
              <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
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
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rutas?.map((ruta) => (
                          <TableRow key={ruta.id}>
                            <TableCell className="font-medium">{ruta.nombre}</TableCell>
                            <TableCell>{ruta.destino}</TableCell>
                            <TableCell>${ruta.precio.toLocaleString()}</TableCell>
                            <TableCell>{ruta.rating} ({ruta.resenas})</TableCell>
                            <TableCell>
                              <Badge variant={ruta.oculta ? "destructive" : "default"}>
                                {ruta.oculta ? "Oculta" : "Visible"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {!ruta.oculta && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => ocultarRutaMutation.mutate(ruta.id)}
                                  disabled={ocultarRutaMutation.isPending}
                                >
                                  Ocultar
                                </Button>
                              )}
                            </TableCell>
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
                          <TableRow key={reserva.id}>
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

            <TabsContent value="usuarios" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" />
                    Gestión de Usuarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {usuariosLoading ? (
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
                          <TableHead>Email</TableHead>
                          <TableHead>Rol</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {usuarios?.map((usuario) => (
                          <TableRow key={usuario.id}>
                            <TableCell className="font-medium">{usuario.nombre}</TableCell>
                            <TableCell>{usuario.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{usuario.rol}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={usuario.suspendido ? "destructive" : "default"}>
                                {usuario.suspendido ? "Suspendido" : "Activo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="space-x-2">
                              {usuario.suspendido ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => restaurarMutation.mutate(usuario.id)}
                                  disabled={restaurarMutation.isPending}
                                >
                                  Restaurar
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setSelectedUser(usuario);
                                    setShowSuspendDialog(true);
                                  }}
                                >
                                  Suspender
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="auditoria" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Auditoría</CardTitle>
                </CardHeader>
                <CardContent>
                  {auditLogsLoading ? (
                    <div className="space-y-2">
                      {[...Array(5)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Acción</TableHead>
                          <TableHead>Entidad</TableHead>
                          <TableHead>Detalles</TableHead>
                          <TableHead>Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs?.slice(0, 20).map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>
                              <Badge>{log.accion}</Badge>
                            </TableCell>
                            <TableCell>{log.entidad}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm">
                              {log.detalles}
                            </TableCell>
                            <TableCell>
                              {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: es })}
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

      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Suspender Usuario</AlertDialogTitle>
          <AlertDialogDescription>
            ¿Estás seguro de que deseas suspender a {selectedUser?.nombre}? Ingresa el motivo:
          </AlertDialogDescription>
          <textarea
            className="w-full p-2 border rounded mb-4"
            placeholder="Motivo de la suspensión..."
            value={motivoSuspension}
            onChange={(e) => setMotivoSuspension(e.target.value)}
            rows={3}
          />
          <div className="flex gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedUser && motivoSuspension) {
                  suspenderMutation.mutate({
                    userId: selectedUser.id,
                    motivo: motivoSuspension,
                  });
                }
              }}
              disabled={suspenderMutation.isPending || !motivoSuspension}
            >
              Suspender
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}
