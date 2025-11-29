import 'dotenv/config';
import { db } from "./db";
import { users, rutas, reservas, calificaciones } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Iniciando seed de la base de datos...");

  try {
    // Limpiar datos existentes (en orden inverso de dependencias)
    console.log("Limpiando datos existentes...");
    await db.delete(calificaciones);
    await db.delete(reservas);
    await db.delete(rutas);
    await db.delete(users);

    // Crear usuarios
    console.log("Creando usuarios...");
    const hashedPassword = await hashPassword("123456");

    const [admin, anfitrion, guia, turista1, turista2] = await db
      .insert(users)
      .values([
        {
          nombre: "Administrador",
          email: "admin@ejcafetero.com",
          password: hashedPassword,
          rol: "admin",
        },
        {
          nombre: "Carlos Mendoza",
          email: "carlos@ejcafetero.com",
          password: hashedPassword,
          rol: "anfitrion",
        },
        {
          nombre: "Laura Gómez",
          email: "laura@ejcafetero.com",
          password: hashedPassword,
          rol: "guia",
        },
        {
          nombre: "María García",
          email: "maria@email.com",
          password: hashedPassword,
          rol: "turista",
        },
        {
          nombre: "Juan Pérez",
          email: "juan@email.com",
          password: hashedPassword,
          rol: "turista",
        },
      ])
      .returning();

    console.log("✅ Usuarios creados");

    // Crear rutas
    console.log("Creando rutas...");
    const rutasData = await db
      .insert(rutas)
      .values([
        {
          nombre: "Valle del Cocora",
          descripcion:
            "Explora el emblemático Valle del Cocora, hogar de las palmas de cera más altas del mundo. Una experiencia inolvidable rodeado de naturaleza exuberante y paisajes montañosos.",
          destino: "Salento",
          duracion: "6-8 horas",
          duracionMinutos: 420,
          precio: 120000,
          precioPorPersona: 120000,
          imagenUrl:
            "https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=800&q=80",
          cupoMaximo: 15,
          rating: "4.8",
          resenas: 156,
          anfitrionId: anfitrion.id,
          tags: ["naturaleza", "senderismo", "fotografía"],
          puntosInteres: [
            "Palmas de cera",
            "Bosque de niebla",
            "Casa de colibríes",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
        {
          nombre: "Recorrido Colonial de Filandia",
          descripcion:
            "Descubre la arquitectura colonial y la cultura cafetera en uno de los pueblos más coloridos del Eje Cafetero. Incluye visita a miradores y degustación de café.",
          destino: "Filandia",
          duracion: "4-5 horas",
          duracionMinutos: 240,
          precio: 80000,
          precioPorPersona: 80000,
          imagenUrl:
            "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&q=80",
          cupoMaximo: 20,
          rating: "4.6",
          resenas: 89,
          anfitrionId: anfitrion.id,
          tags: ["cultura", "café", "arquitectura"],
          puntosInteres: [
            "Mirador de Filandia",
            "Calle del Tiempo Detenido",
            "Finca cafetera",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
        {
          nombre: "Nevado del Ruiz",
          descripcion:
            "Aventura extrema al volcán Nevado del Ruiz. Incluye transporte, equipo especializado y guía experto. Para aventureros experimentados.",
          destino: "Manizales",
          duracion: "10-12 horas",
          duracionMinutos: 660,
          precio: 350000,
          precioPorPersona: 350000,
          imagenUrl:
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
          cupoMaximo: 8,
          rating: "4.9",
          resenas: 45,
          anfitrionId: anfitrion.id,
          tags: ["aventura", "montañismo", "glaciar"],
          puntosInteres: [
            "Cráter del volcán",
            "Glaciares",
            "Lagunas de alta montaña",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
        {
          nombre: "Parque del Café",
          descripcion:
            "Día completo en el Parque Nacional del Café. Disfruta de atracciones mecánicas, shows culturales y aprendizaje sobre el proceso del café.",
          destino: "Montenegro",
          duracion: "8 horas",
          duracionMinutos: 480,
          precio: 95000,
          precioPorPersona: 95000,
          imagenUrl:
            "https://images.unsplash.com/photo-1511537190424-bbbab87ac5eb?w=800&q=80",
          cupoMaximo: 25,
          rating: "4.7",
          resenas: 234,
          anfitrionId: anfitrion.id,
          tags: ["familia", "parque temático", "café"],
          puntosInteres: [
            "Montaña rusa Krater",
            "Show del café",
            "Teleférico",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
        {
          nombre: "Termales Santa Rosa de Cabal",
          descripcion:
            "Relájate en las aguas termales naturales de Santa Rosa de Cabal. Incluye caminata ecológica, baños termales y almuerzo típico.",
          destino: "Pereira",
          duracion: "6 horas",
          duracionMinutos: 360,
          precio: 110000,
          precioPorPersona: 110000,
          imagenUrl:
            "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80",
          cupoMaximo: 18,
          rating: "4.5",
          resenas: 178,
          anfitrionId: anfitrion.id,
          tags: ["relajación", "naturaleza", "termal"],
          puntosInteres: [
            "Piscinas termales",
            "Cascada",
            "Sendero ecológico",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
        {
          nombre: "Ruta del Café Sevilla",
          descripcion:
            "Experiencia completa en una finca cafetera tradicional. Aprende todo el proceso del café desde la siembra hasta la taza. Incluye almuerzo campesino.",
          destino: "Sevilla",
          duracion: "5 horas",
          duracionMinutos: 300,
          precio: 85000,
          precioPorPersona: 85000,
          imagenUrl:
            "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&q=80",
          cupoMaximo: 12,
          rating: "4.8",
          resenas: 92,
          anfitrionId: anfitrion.id,
          tags: ["café", "cultura", "gastronomía"],
          puntosInteres: [
            "Cultivos de café",
            "Proceso de tostado",
            "Cata de café",
          ],
          disponible: true,
          estado: "PUBLICADA",
        },
      ])
      .returning();

    console.log("✅ Rutas creadas");

    // Crear reservas de ejemplo
    console.log("Creando reservas...");
    await db.insert(reservas).values([
      {
        userId: turista1.id,
        rutaId: rutasData[0].id,
        fechaRuta: new Date("2025-12-15T08:00:00"),
        cantidadPersonas: 2,
        estado: "confirmada",
        totalPagado: 240000,
      },
      {
        userId: turista2.id,
        rutaId: rutasData[3].id,
        fechaRuta: new Date("2025-12-20T09:00:00"),
        cantidadPersonas: 4,
        estado: "pendiente",
        totalPagado: 380000,
      },
    ]);

    console.log("✅ Reservas creadas");

    console.log("\n🎉 Seed completado exitosamente!");
    console.log("\n📧 Usuarios creados:");
    console.log("   Admin: admin@ejcafetero.com / 123456");
    console.log("   Anfitrión: carlos@ejcafetero.com / 123456");
    console.log("   Guía: laura@ejcafetero.com / 123456");
    console.log("   Turista 1: maria@email.com / 123456");
    console.log("   Turista 2: juan@email.com / 123456");
    console.log(`\n🗺️  ${rutasData.length} rutas creadas`);
    console.log("📋 2 reservas de ejemplo creadas");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  }
}

seed();
