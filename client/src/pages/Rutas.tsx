import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CardRuta from "@/components/CardRuta";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, X } from "lucide-react";

interface Ruta {
  id: string;
  nombre: string;
  destino: string;
  dificultad: "Fácil" | "Moderado" | "Avanzado";
  duracion: string;
  precio: number;
  imagenUrl: string;
  rating: string;
  resenas: number;
  precioPorPersona: number;
  tags: string[] | null;
}

export default function Rutas() {
  const [destinoFilter, setDestinoFilter] = useState("");
  const [dificultadFilter, setDificultadFilter] = useState("");
  const [precioMax, setPrecioMax] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const availableTags = ["Café", "Aventura", "Naturaleza", "Cultural", "Familiar", "Senderismo"];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setDestinoFilter("");
    setDificultadFilter("");
    setPrecioMax("");
    setSearchQuery("");
    setSelectedTags([]);
  };

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {};
    if (destinoFilter) params.destino = destinoFilter;
    if (dificultadFilter) params.dificultad = dificultadFilter;
    if (precioMax) params.precioMax = precioMax;
    if (searchQuery) params.q = searchQuery;
    if (selectedTags.length > 0) params.tag = selectedTags.join(",");
    return params;
  }, [destinoFilter, dificultadFilter, precioMax, searchQuery, selectedTags]);

  const { data: rutas, isLoading } = useQuery<Ruta[]>({
    queryKey: ["/api/rutas", queryParams],
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="bg-primary/10 py-12 md:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Explora Nuestras Rutas
            </h1>
            <p className="text-lg text-muted-foreground">
              Encuentra la aventura perfecta en el Eje Cafetero
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar rutas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-routes"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar filtros
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  <Filter className="inline h-3.5 w-3.5 mr-1" />
                  Destino
                </label>
                <Select value={destinoFilter} onValueChange={setDestinoFilter}>
                  <SelectTrigger data-testid="select-filter-destination">
                    <SelectValue placeholder="Todos los destinos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los destinos</SelectItem>
                    <SelectItem value="Salento">Salento</SelectItem>
                    <SelectItem value="Filandia">Filandia</SelectItem>
                    <SelectItem value="Manizales">Manizales</SelectItem>
                    <SelectItem value="Pereira">Pereira</SelectItem>
                    <SelectItem value="Montenegro">Montenegro</SelectItem>
                    <SelectItem value="Valle de Cocora">Valle de Cocora</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Dificultad</label>
                <Select value={dificultadFilter} onValueChange={setDificultadFilter}>
                  <SelectTrigger data-testid="select-filter-difficulty">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todas</SelectItem>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Moderado">Moderado</SelectItem>
                    <SelectItem value="Avanzado">Avanzado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-1 sm:col-span-2">
                <label className="text-sm font-medium mb-2 block">Precio máximo</label>
                <Input
                  type="number"
                  placeholder="Ej: 150000"
                  value={precioMax}
                  onChange={(e) => setPrecioMax(e.target.value)}
                  data-testid="input-max-price"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                    data-testid={`tag-${tag.toLowerCase()}`}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-video" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {rutas && rutas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {rutas.map((ruta) => (
                    <CardRuta
                      key={ruta.id}
                      id={ruta.id}
                      nombre={ruta.nombre}
                      destino={ruta.destino}
                      imagen={ruta.imagenUrl}
                      precio={ruta.precio}
                      duracion={ruta.duracion}
                      dificultad={ruta.dificultad}
                      rating={parseFloat(ruta.rating)}
                      resenas={ruta.resenas}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-lg text-muted-foreground">
                    No se encontraron rutas con los filtros seleccionados
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
