import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import heroImage from "@assets/generated_images/Coffee_plantation_hero_image_6c39f7e2.png";

export default function Hero() {
  const [, setLocation] = useLocation();
  const [destino, setDestino] = useState("todos");
  const [dificultad, setDificultad] = useState("todas");

  const handleSearch = () => {
    setLocation("/rutas");
  };

  return (
    <div className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Descubre la Magia del Café
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto drop-shadow-md">
            Vive experiencias únicas en el corazón del Eje Cafetero colombiano
          </p>
        </div>

        <Card className="max-w-4xl mx-auto p-6 bg-background/95 backdrop-blur-md border-none shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destino</label>
              <Select value={destino} onValueChange={setDestino}>
                <SelectTrigger data-testid="select-destination">
                  <SelectValue placeholder="Selecciona destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los destinos</SelectItem>
                  <SelectItem value="salento">Salento</SelectItem>
                  <SelectItem value="cocora">Valle de Cocora</SelectItem>
                  <SelectItem value="filandia">Filandia</SelectItem>
                  <SelectItem value="hacienda">Haciendas Cafeteras</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Dificultad</label>
              <Select value={dificultad} onValueChange={setDificultad}>
                <SelectTrigger data-testid="select-difficulty">
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="facil">Fácil</SelectItem>
                  <SelectItem value="moderado">Moderado</SelectItem>
                  <SelectItem value="avanzado">Avanzado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button className="w-full" size="lg" onClick={handleSearch} data-testid="button-search-routes">
                <Search className="h-4 w-4 mr-2" />
                Buscar Rutas
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
