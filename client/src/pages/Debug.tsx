import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Debug() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [localStorageData, setLocalStorageData] = useState<any>(null);

  const handleCheckLocalStorage = () => {
    const token = localStorage.getItem("auth_token");
    setLocalStorageData({
      token: token ? `${token.substring(0, 30)}...` : "No hay token",
      tokenLength: token?.length || 0,
      timestamp: new Date().toLocaleString(),
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-6">🔧 Página de Depuración</h1>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Estado de Autenticación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">¿Está autenticado?</p>
                <p className="text-lg">{isAuthenticated ? "✅ SÍ" : "❌ NO"}</p>
              </div>

              {isLoading && (
                <div>
                  <p className="font-semibold">Cargando...</p>
                  <p className="text-yellow-600">Esperando respuesta del servidor</p>
                </div>
              )}

              {user && (
                <>
                  <div>
                    <p className="font-semibold">ID:</p>
                    <p>{user.id}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Nombre:</p>
                    <p>{user.nombre}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Email:</p>
                    <p>{user.email}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Rol:</p>
                    <p className="text-blue-600 font-bold">{user.rol.toUpperCase()}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>LocalStorage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={handleCheckLocalStorage}>
                Verificar LocalStorage
              </Button>

              {localStorageData && (
                <div className="bg-muted p-4 rounded">
                  <p className="font-semibold mb-2">Datos encontrados:</p>
                  <pre className="text-sm overflow-auto">
                    {JSON.stringify(localStorageData, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isAuthenticated && (
                <Button onClick={logout} variant="destructive">
                  Cerrar Sesión
                </Button>
              )}

              <Button
                onClick={() => {
                  console.log("Estado actual:", {
                    isAuthenticated,
                    user,
                    isLoading,
                  });
                  alert("Ver consola del navegador para más detalles");
                }}
              >
                Ver en Consola
              </Button>

              <Button
                onClick={() => {
                  window.location.reload();
                }}
              >
                Recargar Página
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 text-sm text-muted-foreground">
            <p>
              Esta página sirve para depurar el estado de autenticación. Prueba:
            </p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Registrarse como anfitrión</li>
              <li>Verificar que aparezca autenticado</li>
              <li>Recargar la página (F5)</li>
              <li>Verificar que sigue autenticado</li>
              <li>Cerrar completamente el navegador</li>
              <li>Abrir la app de nuevo</li>
              <li>Verificar que sigue autenticado</li>
            </ol>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
