import { MapPin, Mail, Phone, Facebook, Instagram, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Eje Cafetero</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Descubre la magia del café colombiano con tours auténticos y experiencias únicas.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-facebook">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-instagram">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-9 w-9" data-testid="button-twitter">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Rutas Populares</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/rutas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Salento
                </Link>
              </li>
              <li>
                <Link href="/rutas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Valle de Cocora
                </Link>
              </li>
              <li>
                <Link href="/rutas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Filandia
                </Link>
              </li>
              <li>
                <Link href="/rutas" className="text-muted-foreground hover:text-foreground transition-colors">
                  Haciendas Cafeteras
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Términos y Condiciones
                </Link>
              </li>
              <li>
                <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Recibe ofertas exclusivas y novedades
            </p>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Tu email"
                className="flex-1"
                data-testid="input-newsletter-email"
              />
              <Button data-testid="button-subscribe">
                Suscribir
              </Button>
            </div>
            <div className="mt-6 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@ejecafetero.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+57 316 123 4567</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; 2024 Rutas del Eje Cafetero. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
