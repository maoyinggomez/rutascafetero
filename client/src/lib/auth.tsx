import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAuthToken } from "./queryClient";

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "turista" | "anfitrion" | "guia";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string, rol: "turista" | "anfitrion" | "guia") => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isAnfitrion: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAuthToken());
  const queryClient = useQueryClient();

  const { data: user, isLoading, refetch } = useQuery<User>({
    queryKey: ["/api", "auth", "me", token],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/auth/me");
      return response;
    },
    enabled: !!token,
    retry: (failureCount, error: any) => {
      // No reintentar si es 401 (unauthorized)
      if (error?.status === 401) {
        localStorage.removeItem("auth_token");
        setToken(null);
        return false;
      }
      // Reintentar máximo 2 veces para otros errores
      return failureCount < 2;
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });

  const loginMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      return await apiRequest("POST", "/api/auth/login", {
        email,
        password,
      });
    },
    onSuccess: (data) => {
      console.log("🔐 LOGIN SUCCESS - Setting token");
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api", "auth", "me", data.token], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({
      nombre,
      email,
      password,
      rol,
    }: {
      nombre: string;
      email: string;
      password: string;
      rol: "turista" | "anfitrion" | "guia";
    }) => {
      return await apiRequest("POST", "/api/auth/register", {
        nombre,
        email,
        password,
        rol,
      });
    },
    onSuccess: (data) => {
      console.log("🔐 REGISTER SUCCESS - Setting token");
      console.log("Data recibida:", { token: data.token?.substring(0, 30), user: data.user.email });
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api", "auth", "me", data.token], data.user);
      console.log("Token en localStorage:", localStorage.getItem("auth_token")?.substring(0, 30));
    },
  });

  const logout = () => {
    setToken(null);
    localStorage.removeItem("auth_token");
    queryClient.clear();
  };

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (nombre: string, email: string, password: string, rol: "turista" | "anfitrion" | "guia") => {
    await registerMutation.mutateAsync({ nombre, email, password, rol });
  };

  // Sincronizar token con localStorage
  useEffect(() => {
    console.log("📝 useEffect token sync - token:", token?.substring(0, 30) || "null");
    if (token) {
      localStorage.setItem("auth_token", token);
      console.log("✅ Token establecido en localStorage");
    } else {
      localStorage.removeItem("auth_token");
      console.log("❌ Token removido de localStorage");
    }
  }, [token]);

  // Refetch cuando el token cambia
  useEffect(() => {
    if (token) {
      refetch();
    }
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.rol === "admin",
        isAnfitrion: user?.rol === "anfitrion",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
