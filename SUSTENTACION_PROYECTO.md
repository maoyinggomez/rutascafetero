# 📋 SUSTENTACIÓN - Rutas Cafetero

## Descripción del Proyecto

**Rutas Cafetero** es una plataforma web full-stack para descubrir, reservar y gestionar rutas turísticas en el Eje Cafetero colombiano. Conecta turistas con anfitriones y guías locales, permitiendo explorar experiencias turísticas únicas.

---

## 📁 Estructura del Proyecto

### 1. **`server/`** - Backend (Node.js + Express + TypeScript)

#### Funciones principales:

| Archivo | Función |
|---------|---------|
| **`index.ts`** | Punto de entrada del servidor. Inicializa Express, configura CORS, middleware, rutas y Vite para el frontend |
| **`routes.ts`** | Define todos los endpoints de la API (760 líneas). Incluye rutas de autenticación, CRUD de rutas, reservas, calificaciones |
| **`auth.ts`** | Autenticación y autorización. Maneja JWT, bcryptjs para hashing de contraseñas, tokens JWT con expiración de 7 días |
| **`db.ts`** | Conexión a PostgreSQL (Neon). Configura Drizzle ORM como cliente de BD |
| **`storage.ts`** | Capa de lógica de negocio. Métodos para usuarios, rutas, reservas, calificaciones, auditoría |
| **`upload.ts`** | Manejo de carga de imágenes. Middleware Multer para procesar uploads |
| **`migrate.ts`** | Script de migraciones. Ejecuta cambios de esquema en BD (crear tablas, columnas, constraints) |
| **`seed.ts`** | Población de datos iniciales para desarrollo y pruebas |
| **`vite.ts`** | Configuración de Vite en desarrollo (hot reload del frontend) |

**Responsabilidades:**
- ✅ Autenticación y autorización de usuarios
- ✅ Gestión de rutas turísticas (CRUD)
- ✅ Sistema de reservas con validaciones
- ✅ Calificaciones y reseñas
- ✅ Auditoría de cambios críticos
- ✅ Control de suspensiones y moderación
- ✅ Validación de roles (turista, anfitrión, guía, admin)

---

### 2. **`client/`** - Frontend (React 18 + TypeScript + Vite)

#### Estructura interna:

```
client/src/
├── components/      # Componentes reutilizables (UI, forms, cards)
├── pages/          # Páginas principales
├── hooks/          # Hooks personalizados (useAuth, useQuery, etc.)
├── lib/            # Utilidades (queryClient, auth context, etc.)
├── App.tsx         # Router principal
└── main.tsx        # Entrada de la aplicación
```

#### Páginas principales:

| Página | Función |
|--------|---------|
| **Home** | Página de inicio con hero section y rutas destacadas |
| **Login** | Autenticación de usuarios con email/contraseña |
| **Register** | Registro con selección de rol (turista/anfitrión/guía) |
| **Rutas** | Listado filtrable de rutas con búsqueda avanzada |
| **RutaDetalle** | Detalle completo de una ruta con mapa, reseñas, horarios |
| **Reservas** | Gestor de reservas del usuario (crear, ver, cancelar) |
| **AdminPanel** | Panel administrativo para gestionar usuarios y contenido |
| **AnfitrionPanel** | Dashboard para anfitriones de rutas (crear/editar rutas) |
| **Debug** | Página de utilidad para pruebas |

**Responsabilidades:**
- ✅ Interfaz responsiva (desktop, tablet, mobile)
- ✅ Autenticación en cliente (JWT en localStorage)
- ✅ Estado global con React Query y Context API
- ✅ Validación de formularios con React Hook Form
- ✅ Componentes UI con Radix UI y Tailwind CSS
- ✅ Navegación con Wouter

---

### 3. **`shared/`** - Esquema compartido entre cliente y servidor

#### Archivo: `schema.ts`

Define:
- **Tablas Drizzle ORM**: users, rutas, reservas, calificaciones, notificaciones, auditoría
- **Enums PostgreSQL**: 
  - `role` (turista, anfitrión, guía, admin)
  - `estado_ruta` (BORRADOR, PUBLICADA, OCULTA, ELIMINADA)
  - `estado_reserva` (pendiente, confirmada, cancelada, cerrada)
  - `tipo_notificacion` (reserva_creada, confirmada, rechazada, cancelada, calificación)
  - `tipo_accion_audit` (crear, actualizar, eliminar, cambiar_estado, suspender, validar_rol)

- **Zod Schemas**: Validación de datos en cliente y servidor (insertUserSchema, insertRutaSchema, etc.)

**Ventaja:** Una sola fuente de verdad para el modelo de datos en frontend y backend.

---

### 4. **`migrations/`** - Migraciones de BD

| Archivo SQL | Función |
|------------|---------|
| **`add_estado_to_rutas.sql`** | Agrega columna `estado` a rutas (RN-06) |
| **`add_rn_features.sql`** | Agrega funcionalidades de requerimientos (RN-07 a RN-15) |

**Nota:** Las migraciones principales están en `server/migrate.ts` para ejecutarse automáticamente.

---

### 5. **`__tests__/`** - Pruebas y scripts de validación

| Archivo | Función |
|---------|---------|
| **`test-auth-flow.ts`** | Prueba flujo completo: registro → login → token |
| **`test-full-flow.ts`** | Prueba completa: crear ruta → reservar → calificar |
| **`test-db.ts`** | Verifica conexión a BD y usuarios |
| **`test-cupo.ts`** | Valida sistema de cupos y disponibilidad |
| **`test-transiciones.ts`** | Prueba máquina de estados (reserva, ruta) |
| **`test-register-web.js`** | Prueba registro en navegador (Playwright) |
| **`test-cancel-reserva.js`** | Prueba cancelación de reservas |

**Función:** Scripts para validar funcionalidades sin framework de test formal.

---

### 6. **`scripts/`** - Scripts de utilidad

| Script | Función |
|--------|---------|
| **`start-server.bat`** | Inicia servidor en Windows |
| **`start-server.sh`** | Inicia servidor en macOS/Linux |

---

### 7. **Archivos de configuración en raíz**

| Archivo | Función |
|---------|---------|
| **`package.json`** | Dependencias y scripts npm (dev, build, start, migrate, seed) |
| **`tsconfig.json`** | Configuración TypeScript |
| **`vite.config.ts`** | Configuración bundler Vite |
| **`drizzle.config.ts`** | Configuración Drizzle ORM y migraciones |
| **`tailwind.config.ts`** | Configuración Tailwind CSS |
| **`postcss.config.js`** | Configuración PostCSS |
| **`components.json`** | Configuración de componentes Radix UI |
| **`.env`** | Variables de entorno (DATABASE_URL, JWT_SECRET, etc.) |
| **`.env.example`** | Plantilla de variables de entorno |
| **`.gitignore`** | Archivos a ignorar en versionado |
| **`README.md`** | Documentación del proyecto |
| **`design_guidelines.md`** | Guía de diseño UI/UX |

---

## 🔄 Flujo de Datos

```
Cliente (React)
    ↓
API Express (/api/*)
    ↓
Capa de Storage (Lógica de negocio)
    ↓
Drizzle ORM (SQL builder)
    ↓
PostgreSQL (Neon)
```

---

## 🔐 Seguridad Implementada

1. **Autenticación JWT** con expiración de 7 días
2. **Hashing de contraseñas** con bcryptjs (10 salt rounds)
3. **CORS** configurado para origen permitido
4. **Validación de datos** con Zod en entrada
5. **Autorización por roles** (turista, anfitrión, guía, admin)
6. **Suspensión de usuarios** moderados (RN-11)
7. **Auditoría de cambios** críticos (tabla audit_log)
8. **Validación de roles** antes de permitir acciones (RN-14)

---

## 📊 Requerimientos Implementados

| Requerimiento | Función |
|---------------|---------|
| **RN-06** | Estados de rutas (BORRADOR → PUBLICADA → OCULTA) |
| **RN-07** | Cancelaciones de reservas con validaciones |
| **RN-08** | Mejoras de reservas (precio al momento, cierre automático) |
| **RN-09** | Sistema de check-ins |
| **RN-10** | Privacidad: datos personales (teléfono, dirección, ciudad) |
| **RN-11** | Moderación: suspensión de usuarios |
| **RN-12** | Transiciones de estado validadas |
| **RN-13** | Notificaciones del sistema |
| **RN-14** | Validación de roles |
| **RN-15** | Auditoría completa de acciones |

---

## 🚀 Stack Tecnológico

### Backend
- **Node.js 18** - Runtime
- **Express.js** - Framework web
- **TypeScript** - Tipado estricto
- **Drizzle ORM** - Query builder SQL type-safe
- **PostgreSQL** (Neon) - Base de datos
- **JWT** - Autenticación token
- **bcryptjs** - Hash de contraseñas
- **Multer** - Upload de archivos
- **CORS** - Control de solicitudes entre dominios

### Frontend
- **React 18** - Librería UI
- **TypeScript** - Tipado estricto
- **Vite** - Bundler (3x más rápido que Webpack)
- **TailwindCSS** - Estilos utility-first
- **Radix UI** - Componentes accesibles
- **React Query** - Gestión de estado de servidor
- **React Hook Form** - Gestión de formularios
- **Wouter** - Router ligero
- **Zod** - Validación de esquemas

### Base de Datos
- **PostgreSQL** en Neon (serverless)
- **Drizzle Kit** - Migraciones y introspección
- **UUID** como IDs primarias

---

## 📈 Escalabilidad

1. **Arquitectura separada** cliente/servidor (fácil despliegue independiente)
2. **ORM type-safe** (Drizzle) evita SQL injections
3. **Validación en ambos lados** (cliente + servidor)
4. **Caching con React Query** (reduce peticiones)
5. **PostgreSQL serverless** (escala automáticamente)
6. **Vite** para builds optimizados

---

## 🎯 Casos de Uso Principales

1. **Turista:**
   - Buscar y filtrar rutas
   - Ver detalles y mapas
   - Crear y gestionar reservas
   - Calificar y dejar reseñas

2. **Anfitrión:**
   - Crear y editar rutas
   - Gestionar cupos disponibles
   - Ver reservas de sus rutas
   - Aceptar/rechazar reservas

3. **Admin:**
   - Gestionar usuarios y roles
   - Suspender usuarios moderados
   - Ver auditoría completa
   - Validar nuevos roles

---

## ✅ Estado Actual

- ✅ **Funcional**: Servidor corriendo en puerto 3000
- ✅ **Limpio**: Estructura organizada y sin archivos obsoletos
- ✅ **Versionado**: Git con commits descriptivos
- ✅ **Seguro**: Autenticación y autorización implementadas
- ✅ **Escalable**: Stack moderno y performante
- ✅ **Documentado**: Comentarios en código y this file

---

## 🔧 Cómo Ejecutar

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev    # Frontend + Backend en http://localhost:3000

# Migrar BD
npm run migrate

# Seed de datos
npm run seed

# Verificar tipos
npm run check

# Build producción
npm run build

# Iniciar producción
npm run start
```

---

## 📝 Conclusión

Rutas Cafetero es una plataforma de **turismo comunitario** que utiliza tecnologías modernas, seguras y escalables para conectar turistas con experiencias locales autenticadas en el Eje Cafetero colombiano.
