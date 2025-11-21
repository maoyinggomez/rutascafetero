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

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api", "auth", "me"],
    enabled: !!token,
    retry: false,
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
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api", "auth", "me"], data.user);
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
      setToken(data.token);
      localStorage.setItem("auth_token", data.token);
      queryClient.setQueryData(["/api", "auth", "me"], data.user);
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

  useEffect(() => {
    if (token) {
      localStorage.setItem("auth_token", token);
    } else {
      localStorage.removeItem("auth_token");
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
