import { useState } from "react";
import { Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RatingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (rating: number, comentario: string) => Promise<void>;
  rutaNombre?: string;
  isLoading?: boolean;
}

export default function RatingModal({
  open,
  onOpenChange,
  onSubmit,
  rutaNombre,
  isLoading = false,
}: RatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comentario, setComentario] = useState<string>("");

  const handleSubmit = async () => {
    if (rating === 0) {
      alert("Por favor, selecciona una calificación");
      return;
    }
    await onSubmit(rating, comentario);
    // Reset form
    setRating(0);
    setComentario("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Califica tu experiencia</DialogTitle>
          <DialogDescription>
            {rutaNombre && `Tu experiencia en ${rutaNombre} ha concluido. `}
            Ayúdanos a mejorar con tu opinión.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Rating Stars */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  size={32}
                  className={`${
                    star <= (hoverRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  } transition-colors`}
                />
              </button>
            ))}
          </div>

          {/* Rating Text */}
          {rating > 0 && (
            <div className="text-center text-sm font-medium">
              {rating === 1 && "Muy malo"}
              {rating === 2 && "Malo"}
              {rating === 3 && "Regular"}
              {rating === 4 && "Muy bueno"}
              {rating === 5 && "Excelente"}
            </div>
          )}

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Comentario (opcional)</label>
            <Textarea
              placeholder="Comparte tu experiencia con otros viajeros y con el anfitrión..."
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              className="min-h-24 resize-none"
              disabled={isLoading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {isLoading ? "Enviando..." : "Enviar Calificación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
