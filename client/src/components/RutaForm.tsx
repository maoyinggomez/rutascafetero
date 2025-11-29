import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, ChevronLeft, ChevronRight } from "lucide-react";

const rutaSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres"),
  destino: z.string().min(2, "Ingresa un destino"),
  duracion: z.string().min(1, "Ingresa la duración"),
  duracionMinutos: z.coerce.number().int().min(5, "Mínimo 5 minutos"),
  precio: z.coerce.number().min(1),
  precioPorPersona: z.coerce.number().min(1),
  cupoMaximo: z.coerce.number().min(1),
  tags: z.string(),
  puntosInteres: z.string(),
  imagenUrl: z.string().optional(),
});

type RutaFormData = z.infer<typeof rutaSchema>;

interface Ruta {
  id: string;
  nombre: string;
  descripcion: string;
  destino: string;
  duracion: string;
  duracionMinutos: number;
  precio: number;
  precioPorPersona: number;
  cupoMaximo: number;
  tags?: string[];
  puntosInteres?: string[];
  imagenUrl?: string;
  imagenes?: string[];
}

interface RutaFormProps {
  onSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  rutaToEdit?: Ruta | null;
}

export default function RutaForm({ onSuccess, isOpen, onOpenChange, rutaToEdit }: RutaFormProps) {
  const [previews, setPreviews] = useState<string[]>(rutaToEdit?.imagenes || rutaToEdit?.imagenUrl ? [rutaToEdit.imagenUrl] : []);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  
  // Calcular horas y minutos desde duracionMinutos si estamos editando
  const [duracionHoras, setDuracionHoras] = useState(
    rutaToEdit ? Math.floor(rutaToEdit.duracionMinutos / 60) : 0
  );
  const [duracionMinutos, setDuracionMinutos] = useState(
    rutaToEdit ? rutaToEdit.duracionMinutos % 60 : 5
  );
  
  const { toast } = useToast();

  const isEditing = !!rutaToEdit;

  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm<RutaFormData>({
    resolver: zodResolver(rutaSchema),
    defaultValues: rutaToEdit ? {
      nombre: rutaToEdit.nombre,
      descripcion: rutaToEdit.descripcion,
      destino: rutaToEdit.destino,
      duracion: rutaToEdit.duracion,
      duracionMinutos: rutaToEdit.duracionMinutos,
      precio: rutaToEdit.precio,
      precioPorPersona: rutaToEdit.precioPorPersona,
      cupoMaximo: rutaToEdit.cupoMaximo,
      tags: rutaToEdit.tags?.join(", ") || "",
      puntosInteres: rutaToEdit.puntosInteres?.join(", ") || "",
      imagenUrl: rutaToEdit.imagenUrl || "",
    } : {
      duracionMinutos: 5,
      cupoMaximo: 20,
    },
  });

  // Sincronizar el valor calculado del formulario cuando cambian horas o minutos locales
  const handleDuracionChange = () => {
    const totalMinutos = duracionHoras * 60 + duracionMinutos;
    setValue("duracionMinutos", totalMinutos);
  };

  // Efecto para sincronizar cuando cambian las horas o minutos
  useEffect(() => {
    handleDuracionChange();
  }, [duracionHoras, duracionMinutos, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: `${file.name} supera los 5MB`,
          variant: "destructive",
        });
        continue;
      }

      if (previews.length + selectedFiles.length >= 5) {
        toast({
          title: "Límite alcanzado",
          description: "Máximo 5 imágenes por ruta",
          variant: "destructive",
        });
        break;
      }

      selectedFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
    
    setSelectedFiles([...selectedFiles]);
  };

  const removePreview = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);

    if (index < selectedFiles.length) {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
    }

    if (currentPreviewIndex >= newPreviews.length) {
      setCurrentPreviewIndex(Math.max(0, newPreviews.length - 1));
    }
  };

  const onSubmit = async (data: RutaFormData) => {
    if (previews.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      
      // Preparar objeto de datos
      const rutaData = {
        ...data,
        tags: data.tags.split(",").map(t => t.trim()).filter(t => t),
        puntosInteres: data.puntosInteres.split(",").map(p => p.trim()).filter(p => p),
        imagenes: previews.filter(p => !p.startsWith('blob:') && !p.startsWith('data:')),
        imagenUrl: previews[0] || "",
      };

      formData.append("data", JSON.stringify(rutaData));
      selectedFiles.forEach((file) => {
        formData.append("imagen", file);
      });

      const token = localStorage.getItem("auth_token");
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? `/api/rutas/${rutaToEdit.id}` : "/api/rutas";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || (isEditing ? "Error al actualizar ruta" : "Error al crear ruta"));
      }

      toast({
        title: "Éxito",
        description: isEditing ? "Ruta actualizada correctamente" : "Ruta creada correctamente",
      });

      reset();
      setPreviews([]);
      setSelectedFiles([]);
      setCurrentPreviewIndex(0);
      setDuracionHoras(0);
      setDuracionMinutos(5);
      onSuccess?.();
      onOpenChange?.(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!rutaToEdit && (
        <DialogTrigger asChild>
          <Button>Crear Nueva Ruta</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ruta" : "Crear Nueva Ruta"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="font-semibold">Información Básica</h3>
            
            <div>
              <Label>Nombre de la Ruta</Label>
              <Input
                {...register("nombre")}
                placeholder="ej: Valle del Cocora"
              />
              {errors.nombre && (
                <p className="text-sm text-red-500 mt-1">{errors.nombre.message}</p>
              )}
            </div>

            <div>
              <Label>Descripción</Label>
              <Textarea
                {...register("descripcion")}
                placeholder="Describe la ruta en detalle..."
                rows={4}
              />
              {errors.descripcion && (
                <p className="text-sm text-red-500 mt-1">{errors.descripcion.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Destino</Label>
                <Input
                  {...register("destino")}
                  placeholder="ej: Salento"
                />
                {errors.destino && (
                  <p className="text-sm text-red-500 mt-1">{errors.destino.message}</p>
                )}
              </div>

              <div>
                <Label>Duración (texto)</Label>
                <Input
                  {...register("duracion")}
                  placeholder="ej: 6-8 horas"
                />
              </div>
            </div>
          </div>

          {/* Duración y Precio */}
          <div className="space-y-4">
            <h3 className="font-semibold">Duración y Precio</h3>
            
            <div className="space-y-3">
              <Label>Duración Mínima</Label>
              <select
                value={`${duracionHoras}:${duracionMinutos}`}
                onChange={(e) => {
                  const [horas, minutos] = e.target.value.split(":").map(Number);
                  setDuracionHoras(horas);
                  setDuracionMinutos(minutos);
                  const totalMinutos = horas * 60 + minutos;
                  setValue("duracionMinutos", totalMinutos);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="0:5">5 minutos</option>
                <option value="0:10">10 minutos</option>
                <option value="0:15">15 minutos</option>
                <option value="0:30">30 minutos</option>
                <option value="1:0">1 hora</option>
                <option value="1:30">1 hora 30 minutos</option>
                <option value="2:0">2 horas</option>
                <option value="2:30">2 horas 30 minutos</option>
                <option value="3:0">3 horas</option>
                <option value="4:0">4 horas</option>
                <option value="5:0">5 horas</option>
                <option value="6:0">6 horas</option>
                <option value="8:0">8 horas</option>
                <option value="10:0">10 horas</option>
                <option value="12:0">12 horas</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Seleccionado: {duracionHoras}h {duracionMinutos}min ({duracionHoras * 60 + duracionMinutos} minutos)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Precio Total</Label>
                <Input
                  type="number"
                  {...register("precio")}
                  placeholder="0"
                  min="1"
                />
              </div>

              <div>
                <Label>Precio por Persona</Label>
                <Input
                  type="number"
                  {...register("precioPorPersona")}
                  placeholder="0"
                  min="1"
                />
              </div>
            </div>

            <div>
              <Label>Cupo Máximo</Label>
              <Input
                type="number"
                {...register("cupoMaximo")}
                min="1"
                defaultValue="20"
              />
            </div>
          </div>

          {/* Puntos de Interés */}
          <div className="space-y-4">
            <h3 className="font-semibold">Detalles Adicionales</h3>

            <div>
              <Label>Tags (separados por coma)</Label>
              <Input
                {...register("tags")}
                placeholder="naturaleza, senderismo, fotografía"
              />
            </div>

            <div>
              <Label>Puntos de Interés (separados por coma)</Label>
              <Input
                {...register("puntosInteres")}
                placeholder="Palmas de cera, Bosque de niebla, Casa de colibríes"
              />
            </div>
          </div>

          {/* Upload de Imágenes */}
          <div className="space-y-4">
            <h3 className="font-semibold">Imágenes de la Ruta (Máximo 5)</h3>

            {/* Carrusel de previsualización */}
            {previews.length > 0 && (
              <Card className="relative bg-gray-100 rounded-lg overflow-hidden">
                <div className="relative h-64 w-full flex items-center justify-center">
                  <img
                    src={previews[currentPreviewIndex]}
                    alt={`Preview ${currentPreviewIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Botones de navegación */}
                  {previews.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentPreviewIndex(prev => prev === 0 ? previews.length - 1 : prev - 1)}
                        className="absolute left-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPreviewIndex(prev => prev === previews.length - 1 ? 0 : prev + 1)}
                        className="absolute right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  {/* Indicador de página */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                    {currentPreviewIndex + 1} / {previews.length}
                  </div>
                </div>

                {/* Galería de miniaturas */}
                <div className="flex gap-2 p-3 bg-white overflow-x-auto">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative flex-shrink-0">
                      <img
                        src={preview}
                        alt={`Thumb ${idx + 1}`}
                        className={`h-16 w-16 object-cover rounded cursor-pointer border-2 transition ${
                          currentPreviewIndex === idx ? "border-blue-500" : "border-gray-300 hover:border-blue-300"
                        }`}
                        onClick={() => setCurrentPreviewIndex(idx)}
                      />
                      <button
                        type="button"
                        onClick={() => removePreview(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {previews.length < 5 && (
              <div className="flex items-center justify-center">
                <label className="w-full cursor-pointer">
                  <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded hover:bg-gray-50 transition">
                    <Upload size={20} />
                    <div className="text-center">
                      <span>Clic para agregar más imágenes</span>
                      <p className="text-xs text-gray-500">({previews.length}/5)</p>
                    </div>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center">
              Formatos: JPG, PNG, WebP, GIF | Máximo: 5MB por imagen | Máximo 5 imágenes
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange?.(false);
                reset();
                setPreviews([]);
                setSelectedFiles([]);
                setCurrentPreviewIndex(0);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (isEditing ? "Actualizando..." : "Creando...") : (isEditing ? "Actualizar Ruta" : "Crear Ruta")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
