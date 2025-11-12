import { db } from "./db";
import { users, rutas } from "@shared/schema";
import { hashPassword } from "./auth";

async function seed() {
  console.log("🌱 Iniciando seed de la base de datos...");

  try {
    // Crear usuario administrador
    const adminPassword = await hashPassword("admin123");
    const [admin] = await db
      .insert(users)
      .values({
        nombre: "Administrador",
        email: "admin@ejecafetero.com",
        password: adminPassword,
        rol: "admin",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Usuario admin creado:", admin?.email || "ya existía");

    // Crear usuario de prueba
    const userPassword = await hashPassword("usuario123");
    const [user] = await db
      .insert(users)
      .values({
        nombre: "Juan Pérez",
        email: "juan@example.com",
        password: userPassword,
        rol: "turista",
      })
      .onConflictDoNothing()
      .returning();

    console.log("✅ Usuario de prueba creado:", user?.email || "ya existía");

    // Crear rutas turísticas
    const rutasData = [
      {
        nombre: "Tour Salento y Pueblo Mágico",
        descripcion:
          "Descubre el encanto colonial de Salento, uno de los pueblos más coloridos de Colombia. Camina por sus calles empedradas, visita artesanías locales y disfruta de la arquitectura tradicional cafetera. Incluye visita al mirador y degustación de café.",
        destino: "Salento, Quindío",
        dificultad: "Fácil" as const,
        duracion: "8 horas",
        precio: 85000,
        imagenUrl: "/assets/generated_images/Salento_town_route_destination_5fb0d1a7.png",
        cupoMaximo: 15,
        duracionHoras: 8,
        precioPorPersona: 85000,
        tags: ["cultura", "pueblo", "café", "fotografía"],
        puntosInteres: ["Centro de Salento", "Mirador del pueblo", "Artesanías locales", "Cafés tradicionales"],
      },
      {
        nombre: "Caminata Valle de Cocora",
        descripcion:
          "Aventúrate en el Valle de Cocora, hogar de las palmas de cera más altas del mundo. Caminata de dificultad moderada por senderos montañosos, cruce de puentes colgantes y paisajes impresionantes. Incluye guía experto y almuerzo típico.",
        destino: "Valle de Cocora",
        dificultad: "Moderado" as const,
        duracion: "6 horas",
        precio: 120000,
        imagenUrl: "/assets/generated_images/Valle_de_Cocora_palms_b0cf6489.png",
        cupoMaximo: 12,
        duracionHoras: 6,
        precioPorPersona: 120000,
        tags: ["naturaleza", "senderismo", "palmas", "aventura"],
        puntosInteres: ["Valle de Cocora", "Palmas de cera", "Puentes colgantes", "Bosque de niebla"],
      },
      {
        nombre: "Experiencia Cafetera Completa",
        descripcion:
          "Vive la experiencia completa del café colombiano en una hacienda tradicional. Participa en la recolección de café, aprende sobre el proceso de producción, y disfruta de una cata profesional. Incluye almuerzo campesino y transporte.",
        destino: "Hacienda El Ocaso",
        dificultad: "Fácil" as const,
        duracion: "5 horas",
        precio: 95000,
        imagenUrl: "/assets/generated_images/Coffee_farm_hacienda_24d7dcc7.png",
        cupoMaximo: 20,
        duracionHoras: 5,
        precioPorPersona: 95000,
        tags: ["café", "hacienda", "gastronomía", "cultura"],
        puntosInteres: ["Plantación de café", "Proceso de producción", "Cata profesional", "Almuerzo campesino"],
      },
      {
        nombre: "Filandia y Mirador 360°",
        descripcion:
          "Explora Filandia, el pueblo de colores del Quindío. Sube al mirador 360° para vistas panorámicas de la región cafetera, visita talleres de artesanías y disfruta de la gastronomía local. Tour relajado ideal para familias.",
        destino: "Filandia, Quindío",
        dificultad: "Fácil" as const,
        duracion: "4 horas",
        precio: 75000,
        imagenUrl: "/assets/generated_images/Filandia_viewpoint_6d15e32f.png",
        cupoMaximo: 18,
        duracionHoras: 4,
        precioPorPersona: 75000,
        tags: ["pueblo", "mirador", "artesanías", "familia"],
        puntosInteres: ["Centro de Filandia", "Mirador 360°", "Talleres artesanales", "Gastronomía local"],
      },
      {
        nombre: "Cata de Café Premium",
        descripcion:
          "Conviértete en catador de café por un día. Aprende a identificar notas y perfiles de sabor en diferentes variedades de café colombiano. Sesión guiada por barista profesional en finca cafetera. Perfecto para amantes del café.",
        destino: "Finca Cafetera",
        dificultad: "Fácil" as const,
        duracion: "3 horas",
        precio: 65000,
        imagenUrl: "/assets/generated_images/Coffee_tasting_experience_1273dbb0.png",
        cupoMaximo: 10,
        duracionHoras: 3,
        precioPorPersona: 65000,
        tags: ["café", "cata", "profesional", "degustación"],
        puntosInteres: ["Finca cafetera", "Variedades de café", "Sesión con barista", "Cata guiada"],
      },
      {
        nombre: "Aventura Cocora Completa",
        descripcion:
          "Ruta completa de senderismo en el Valle de Cocora. Incluye caminata de 12km por bosque de niebla, avistamiento de aves, visita a cascadas escondidas y almuerzo en finca. Para aventureros experimentados. Guía especializado incluido.",
        destino: "Valle de Cocora",
        dificultad: "Avanzado" as const,
        duracion: "1 día",
        precio: 150000,
        imagenUrl: "/assets/generated_images/Valle_de_Cocora_palms_b0cf6489.png",
        cupoMaximo: 8,
        duracionHoras: 8,
        precioPorPersona: 150000,
        tags: ["senderismo", "aventura", "naturaleza", "avanzado"],
        puntosInteres: ["Valle de Cocora", "Bosque de niebla", "Cascadas", "Avistamiento de aves"],
      },
      {
        nombre: "Tour Nocturno del Café",
        descripcion:
          "Experimenta la vida nocturna de una finca cafetera. Observa luciérnagas, escucha los sonidos de la noche y participa en una fogata con historias cafeteras. Incluye cena típica y bebidas calientes. Una experiencia única y mágica.",
        destino: "Hacienda El Ocaso",
        dificultad: "Fácil" as const,
        duracion: "4 horas",
        precio: 80000,
        imagenUrl: "/assets/generated_images/Coffee_farm_hacienda_24d7dcc7.png",
        cupoMaximo: 16,
        duracionHoras: 4,
        precioPorPersona: 80000,
        tags: ["nocturno", "luciérnagas", "fogata", "experiencia"],
        puntosInteres: ["Finca cafetera", "Luciérnagas", "Fogata", "Cena típica"],
      },
      {
        nombre: "Circuito de Pueblos Cafeteros",
        descripcion:
          "Recorre los tres pueblos más emblemáticos del Eje Cafetero: Salento, Filandia y Pijao. Tour completo que incluye visitas guiadas, tiempo libre en cada pueblo, almuerzo y transporte. Conoce la diversidad cultural de la región.",
        destino: "Salento, Quindío",
        dificultad: "Fácil" as const,
        duracion: "1 día",
        precio: 110000,
        imagenUrl: "/assets/generated_images/Salento_town_route_destination_5fb0d1a7.png",
        cupoMaximo: 20,
        duracionHoras: 8,
        precioPorPersona: 110000,
        tags: ["pueblos", "cultura", "tour", "gastronomía"],
        puntosInteres: ["Salento", "Filandia", "Pijao", "Almuerzo incluido"],
      },
    ];

    for (const rutaData of rutasData) {
      const [ruta] = await db
        .insert(rutas)
        .values(rutaData)
        .onConflictDoNothing()
        .returning();
      
      if (ruta) {
        console.log(`✅ Ruta creada: ${ruta.nombre}`);
      }
    }

    console.log("\n🎉 Seed completado exitosamente!");
    console.log("\n📝 Credenciales de prueba:");
    console.log("   Admin: admin@ejecafetero.com / admin123");
    console.log("   Usuario: juan@example.com / usuario123");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el seed:", error);
    process.exit(1);
  }
}

seed();
