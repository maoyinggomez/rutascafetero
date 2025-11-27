import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, X } from "lucide-react";

const rutaSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres"),
  descripcion: z.string().min(10, "Mínimo 10 caracteres"),
  destino: z.string().min(2, "Ingresa un destino"),
  dificultad: z.enum(["Fácil", "Moderado", "Avanzado"]),
  duracion: z.string().min(1, "Ingresa la duración"),
  duracionHoras: z.coerce.number().min(1),
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
  dificultad: string;
  duracion: string;
  duracionHoras: number;
  precio: number;
  precioPorPersona: number;
  cupoMaximo: number;
  tags?: string[];
  puntosInteres?: string[];
  imagenUrl?: string;
}

interface RutaFormProps {
  onSuccess?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  rutaToEdit?: Ruta | null;
}

export default function RutaForm({ onSuccess, isOpen: isOpenProp, onOpenChange, rutaToEdit }: RutaFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(rutaToEdit?.imagenUrl || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Si se pasa isOpen, usamos ese; si no, usamos el estado interno
  const isOpen = isOpenProp !== undefined ? isOpenProp : internalOpen;
  
  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  const isEditing = !!rutaToEdit;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<RutaFormData>({
    resolver: zodResolver(rutaSchema),
    defaultValues: rutaToEdit ? {
      nombre: rutaToEdit.nombre,
      descripcion: rutaToEdit.descripcion,
      destino: rutaToEdit.destino,
      dificultad: rutaToEdit.dificultad as "Fácil" | "Moderado" | "Avanzado",
      duracion: rutaToEdit.duracion,
      duracionHoras: rutaToEdit.duracionHoras,
      precio: rutaToEdit.precio,
      precioPorPersona: rutaToEdit.precioPorPersona,
      cupoMaximo: rutaToEdit.cupoMaximo,
      tags: rutaToEdit.tags?.join(", ") || "",
      puntosInteres: rutaToEdit.puntosInteres?.join(", ") || "",
      imagenUrl: rutaToEdit.imagenUrl || "",
    } : {
      duracionHoras: 1,
      cupoMaximo: 20,
      dificultad: "Fácil",
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "La imagen no debe superar 5MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: RutaFormData) => {
    try {
      setIsLoading(true);

      // Preparar objeto de datos
      let imagenUrl: string | undefined = undefined;
      
      if (selectedFile) {
        // Convertir archivo a base64
        imagenUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      } else {
        imagenUrl = data.imagenUrl || undefined;
      }

      const rutaData = {
        ...data,
        tags: data.tags.split(",").map(t => t.trim()).filter(t => t),
        puntosInteres: data.puntosInteres.split(",").map(p => p.trim()).filter(p => p),
        imagenUrl,
      };

      const token = localStorage.getItem("auth_token");
      const method = isEditing ? "PATCH" : "POST";
      const url = isEditing ? `/api/rutas/${rutaToEdit.id}` : "/api/rutas";

      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(rutaData),
      });

      if (!response.ok) {
        let errorMessage = isEditing ? "Error al actualizar ruta" : "Error al crear ruta";
        try {
          const error = await response.json();
          errorMessage = error.error || errorMessage;
        } catch (e) {
          errorMessage = `${response.status} ${response.statusText}: ${errorMessage}`;
        }
        throw new Error(errorMessage);
      }

      toast({
        title: "Éxito",
        description: isEditing ? "Ruta actualizada correctamente" : "Ruta creada correctamente",
      });

      reset();
      setPreview(null);
      setSelectedFile(null);
      onSuccess?.();
      handleOpenChange(false);
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
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {!rutaToEdit && !isOpenProp && (
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
                <Label>Dificultad</Label>
                <Controller
                  name="dificultad"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Fácil">Fácil</SelectItem>
                        <SelectItem value="Moderado">Moderado</SelectItem>
                        <SelectItem value="Avanzado">Avanzado</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Duración y Precio */}
          <div className="space-y-4">
            <h3 className="font-semibold">Duración y Precio</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duración (texto)</Label>
                <Input
                  {...register("duracion")}
                  placeholder="ej: 6-8 horas"
                />
              </div>

              <div>
                <Label>Duración (horas)</Label>
                <Input
                  type="number"
                  {...register("duracionHoras")}
                  min="1"
                />
              </div>
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

          {/* Upload de Imagen */}
          <div className="space-y-4">
            <h3 className="font-semibold">Imagen de la Ruta</h3>

            <Card className="border-2 border-dashed p-6">
              <div className="space-y-4">
                {preview && (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreview(null);
                        setSelectedFile(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center">
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 p-6 border-2 border-dashed rounded hover:bg-gray-50">
                      <Upload size={20} />
                      <span>Clic para subir imagen</span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <p className="text-sm text-gray-500 text-center">
                  Formatos: JPG, PNG, WebP, GIF | Máximo: 5MB
                </p>
              </div>
            </Card>

            {!selectedFile && (
              <div>
                <Label>O ingresa URL de imagen</Label>
                <Input
                  {...register("imagenUrl")}
                  type="url"
                  placeholder="https://ejemplo.com/imagen.jpg"
                />
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                reset();
                setPreview(null);
                setSelectedFile(null);
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
