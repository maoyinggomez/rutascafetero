# Rutas Cafetero 🏔️☕

Plataforma web para descubrir, reservar y gestionar rutas turísticas en el Eje Cafetero colombiano. Conecta turistas con anfitriones y guías locales.

## 🚀 Características

- **Autenticación segura** con JWT y bcryptjs
- **Gestión de rutas turísticas** con filtros avanzados
- **Sistema de reservas** con confirmación y cancelación
- **Roles de usuario** (Turista, Anfitrión, Guía, Admin)
- **Panel administrativo** para gestionar contenido
- **Interfaz responsiva** con Tailwind CSS y componentes Radix UI
- **Base de datos PostgreSQL** en Neon

## 📋 Stack Tecnológico

### Backend
- **Node.js 18** + Express
- **TypeScript** para tipado estricto
- **Drizzle ORM** con PostgreSQL (Neon)
- **JWT** para autenticación
- **bcryptjs** para hash de contraseñas
- **CORS** habilitado

### Frontend
- **React 18** con TypeScript
- **Vite** como bundler
- **TailwindCSS** para estilos
- **Radix UI** para componentes accesibles
- **React Query** para gestión de estado
- **React Hook Form** para formularios
- **React Router** para navegación

### Base de Datos
- **PostgreSQL** en Neon
- **Drizzle Kit** para migraciones
- Enums para roles y estados

## 🛠️ Instalación

### Requisitos previos
- Node.js 18+
- npm o yarn
- Git

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/maoyinggomez/rutascafetero.git
cd rutascafetero
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
Crear archivo `.env` en la raíz:
```env
DATABASE_URL=postgresql://neondb_owner:npg_5OqldI4xhHcR@ep-blue-brook-ad2rcsef-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecreto123
PORT=3000
HOST=127.0.0.1
```

4. **Sincronizar esquema de base de datos**
```bash
npm run db:push
```

5. **Crear datos de prueba (seed)**
```bash
npm run seed
```

6. **Iniciar servidor de desarrollo**
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Usuarios de Prueba

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@ejcafetero.com | 123456 | Admin |
| carlos@ejcafetero.com | 123456 | Anfitrión |
| laura@ejcafetero.com | 123456 | Guía |
| maria@email.com | 123456 | Turista |
| juan@email.com | 123456 | Turista |

## 📁 Estructura del Proyecto

```
rutascafetero/
├── client/                 # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes reutilizables
│   │   ├── pages/          # Páginas de la aplicación
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilidades y configuración
│   │   └── main.tsx        # Punto de entrada
│   └── index.html
├── server/                 # Servidor Express
│   ├── index.ts            # Configuración del servidor
│   ├── routes.ts           # Rutas API
│   ├── db.ts               # Conexión a BD
│   ├── auth.ts             # Autenticación
│   ├── seed.ts             # Datos iniciales
│   └── vite.ts             # Configuración Vite
├── shared/                 # Código compartido
│   └── schema.ts           # Esquema de BD con Drizzle
├── package.json
├── tsconfig.json
├── vite.config.ts
└── drizzle.config.ts
```

## 🗄️ Esquema de Base de Datos

### Tabla `users`
```typescript
- id: UUID (PK)
- nombre: string
- email: string (unique)
- password: string (hashed)
- rol: enum['turista', 'anfitrion', 'guia', 'admin']
```

### Tabla `rutas`
```typescript
- id: UUID (PK)
- nombre: string
- descripcion: string
- destino: string
- dificultad: enum['Fácil', 'Moderado', 'Avanzado']
- duracion: string
- duracionHoras: integer
- precio: integer
- precioPorPersona: integer
- imagenUrl: string
- cupoMaximo: integer
- rating: decimal
- resenas: integer
- tags: string[]
- puntosInteres: string[]
- disponible: boolean
- anfitrionId: UUID (FK → users)
```

### Tabla `reservas`
```typescript
- id: UUID (PK)
- userId: UUID (FK → users)
- rutaId: UUID (FK → rutas)
- fechaRuta: timestamp
- cantidadPersonas: integer
- estado: enum['pendiente', 'confirmada', 'cancelada']
- totalPagado: integer
- createdAt: timestamp
```

## 🔌 Rutas API

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Rutas
- `GET /api/rutas` - Listar todas las rutas
- `GET /api/rutas/:id` - Obtener detalle de ruta
- `POST /api/rutas` - Crear ruta (Anfitrión)
- `PUT /api/rutas/:id` - Actualizar ruta (Anfitrión)
- `DELETE /api/rutas/:id` - Eliminar ruta (Anfitrión)

### Reservas
- `GET /api/reservas` - Listar mis reservas
- `POST /api/reservas` - Crear reserva
- `PUT /api/reservas/:id` - Actualizar estado de reserva
- `DELETE /api/reservas/:id` - Cancelar reserva

## 🔐 Autenticación

La aplicación utiliza JWT (JSON Web Tokens) para autenticación:

1. El usuario se registra o inicia sesión
2. El servidor devuelve un token JWT
3. El cliente envía el token en el header `Authorization: Bearer <token>`
4. El servidor valida el token en cada solicitud protegida

Las contraseñas se hashean con bcryptjs antes de almacenarse.

## 🎨 Componentes Principales

### Frontend
- **Navbar** - Navegación principal
- **Hero** - Sección destacada
- **CardRuta** - Tarjeta de ruta
- **FeaturedRoutes** - Galería de rutas destacadas
- **AdminPanel** - Panel de administración
- **RutaDetalle** - Página de detalle de ruta
- **Reservas** - Página de reservas del usuario

### UI Components
- Buttons, Cards, Forms
- Modals, Dropdowns
- Toasts para notificaciones
- Theme Toggle (Modo oscuro/claro)

## 📝 Scripts Disponibles

```bash
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Compilar para producción
npm start            # Ejecutar versión producción
npm run check        # Verificar tipos TypeScript
npm run db:push      # Sincronizar esquema con BD
npm run seed         # Crear datos de prueba
```

## 🚀 Deployment

### Build para producción
```bash
npm run build
```

Esto genera:
- Frontend compilado en `dist/public`
- Backend compilado en `dist/index.js`

### Ejecutar en producción
```bash
npm start
```

## 🔒 Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://...

# Autenticación
JWT_SECRET=tu_secreto_super_seguro

# Servidor
PORT=3000
HOST=127.0.0.1
```

## 🐛 Troubleshooting

### Puerto ya en uso
```bash
# Windows PowerShell
Get-Process -Name "node" | Stop-Process -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Problemas de BD
```bash
# Reconectar a BD
npm run db:push

# Recrear datos
npm run seed
```

### Limpiar cache
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

## 📄 Licencia

MIT

## 👨‍💻 Autor

Mauro Yinggomez - [GitHub](https://github.com/maoyinggomez)

## 📞 Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Última actualización:** 21 de Noviembre de 2025
