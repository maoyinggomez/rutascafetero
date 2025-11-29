import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL || "");

async function fixHoraFin() {
  try {
    console.log("🔄 Actualizando horaFin en reservas...");

    // Obtener todas las reservas sin horaFin
    const reservasWithoutHoraFin = await sql`
      SELECT r.id, r.fecha_ruta, ru.duracion_minutos
      FROM reservas r
      LEFT JOIN rutas ru ON r.ruta_id = ru.id
      WHERE r.hora_fin IS NULL AND r.hora_inicio IS NOT NULL
      ORDER BY r.fecha_ruta;
    `;

    console.log(`📋 Encontradas ${reservasWithoutHoraFin.length} reservas sin horaFin`);

    if (reservasWithoutHoraFin.length === 0) {
      console.log("✅ Todas las reservas tienen horaFin");
      await sql.end();
      return;
    }

    // Actualizar cada reserva calculando horaFin
    let updated = 0;
    for (const reserva of reservasWithoutHoraFin) {
      try {
        // Obtener la reserva completa con hora_inicio
        const [fullReserva] = await sql`
          SELECT hora_inicio, fecha_ruta
          FROM reservas
          WHERE id = ${reserva.id};
        `;

        if (!fullReserva.hora_inicio) {
          console.log(`⏭️  Saltando reserva ${reserva.id} - sin horaInicio`);
          continue;
        }

        // Calcular horaFin: horaInicio + duracionMinutos
        const [horas, minutos] = fullReserva.hora_inicio.split(":").map(Number);
        const endDate = new Date(fullReserva.fecha_ruta);
        endDate.setHours(horas, minutos, 0, 0);
        endDate.setMinutes(endDate.getMinutes() + (reserva.duracion_minutos || 0));

        const horaFin = endDate.toLocaleTimeString("es-ES", { 
          hour: "2-digit", 
          minute: "2-digit",
          hour12: false 
        });

        // Actualizar
        await sql`
          UPDATE reservas
          SET hora_fin = ${horaFin}
          WHERE id = ${reserva.id};
        `;

        updated++;
        console.log(`✅ Reserva ${reserva.id}: horaFin = ${horaFin}`);
      } catch (err) {
        console.error(`❌ Error actualizando reserva ${reserva.id}:`, err);
      }
    }

    console.log(`\n✅ ${updated} reservas actualizadas exitosamente!`);

    // Verificar resultados
    const allReservas = await sql`
      SELECT id, hora_inicio, hora_fin, estado
      FROM reservas
      ORDER BY fecha_ruta DESC
      LIMIT 5;
    `;

    console.log("\n📋 Últimas 5 reservas:");
    allReservas.forEach(r => {
      console.log(`   - ${r.id}: ${r.hora_inicio} - ${r.hora_fin} (${r.estado})`);
    });

    await sql.end();
  } catch (error) {
    console.error("❌ Error:", error);
    await sql.end();
    throw error;
  }
}

fixHoraFin();
