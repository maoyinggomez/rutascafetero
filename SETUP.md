# 🚀 Guía de Configuración - Rutas Cafetero

Esta guía te ayudará a clonar, instalar y ejecutar la aplicación **Rutas Cafetero** en tu PC.

---

## 📋 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js 18 o superior**
   - Descarga desde: https://nodejs.org/
   - Verifica la instalación:
     ```bash
     node --version
     npm --version
     ```

2. **Git**
   - Descarga desde: https://git-scm.com/
   - Verifica la instalación:
     ```bash
     git --version
     ```

3. **Un navegador web moderno** (Chrome, Firefox, Safari, Edge)

---

## 🔧 Pasos de Instalación

### 1. Clonar el Repositorio

```bash
git clone https://github.com/maoyinggomez/rutascafetero.git
cd rutascafetero
```

### 2. Instalar Dependencias

En la raíz del proyecto:

```bash
npm install
```

**Nota:** Este comando instala todas las dependencias necesarias para frontend y backend.

### 3. Verificar el Archivo `.env`

El archivo `.env` ya está configurado en el repositorio con la conexión a la base de datos PostgreSQL (Neon).

Si necesitas cambiar valores, edita `.env`:

```env
DATABASE_URL=postgresql://neondb_owner:npg_5OqldI4xhHcR@ep-blue-brook-ad2rcsef-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=supersecreto123
PORT=3000
HOST=127.0.0.1
```

### 4. Sincronizar la Base de Datos (Opcional)

Si la BD necesita actualizarse:

```bash
npm run db:push
```

### 5. Cargar Datos de Prueba (Seed)

```bash
npm run seed
```

Esto creará:
- 5 usuarios de prueba
- 6 rutas de ejemplo
- 2 reservas de ejemplo

---

## ▶️ Ejecutar la Aplicación

### Modo Desarrollo (Frontend + Backend)

```bash
npm run dev
```

La aplicación estará disponible en:
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:3000/api

El servidor recargará automáticamente los cambios que hagas en el código.

---

## 👤 Usuarios de Prueba

Usa estos credenciales para probar la aplicación:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@ejcafetero.com | 123456 | Admin |
| carlos@ejcafetero.com | 123456 | Anfitrión |
| laura@ejcafetero.com | 123456 | Guía |
| maria@email.com | 123456 | Turista |
| juan@email.com | 123456 | Turista |

---

## 📦 Scripts Disponibles

```bash
npm run dev              # Inicia servidor de desarrollo
npm run build            # Compila para producción
npm start                # Ejecuta versión compilada (producción)
npm run check            # Verifica tipos TypeScript
npm run db:push          # Sincroniza esquema con BD
npm run seed             # Carga datos de prueba
```

---

## 🛑 Detener la Aplicación

Presiona **`Ctrl + C`** en la terminal donde está corriendo el servidor.

Si la app sigue corriendo, mata el proceso:

**PowerShell (Windows):**
```powershell
Get-Process -Name "node" | Stop-Process -Force
```

**Linux/Mac:**
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 🐛 Troubleshooting

### El puerto 3000 ya está en uso

**Opción 1:** Mata el proceso anterior:
```bash
# Windows PowerShell
Get-Process -Name "node" | Stop-Process -Force

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

**Opción 2:** Usa otro puerto editando `.env`:
```env
PORT=3001
```

### Error de conexión a base de datos

1. Verifica que tienes internet conectado
2. Comprueba que la URL en `.env` es correcta
3. Intenta sincronizar la BD:
   ```bash
   npm run db:push
   ```

### node_modules corrupto o falta de paquetes

```bash
# Elimina node_modules y package-lock.json
rm -r node_modules package-lock.json

# Reinstala todo
npm install
```

### TypeScript errors

```bash
npm run check
```

---

## 📂 Estructura del Proyecto

```
rutascafetero/
├── client/                 # Aplicación React (Frontend)
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilidades
│   └── index.html
├── server/                 # Servidor Express (Backend)
│   ├── index.ts            # Entrada principal
│   ├── routes.ts           # Rutas API
│   ├── db.ts               # Conexión BD
│   ├── auth.ts             # Autenticación
│   └── seed.ts             # Datos iniciales
├── shared/                 # Código compartido
│   └── schema.ts           # Esquema Drizzle ORM
├── .env                    # Variables de entorno
├── package.json            # Dependencias
├── vite.config.ts          # Config Vite (Frontend)
├── tsconfig.json           # Config TypeScript
└── drizzle.config.ts       # Config Drizzle ORM
```

---

## 🚀 Próximos Pasos

1. ✅ Instala Node.js y Git
2. ✅ Clona el repositorio
3. ✅ Ejecuta `npm install`
4. ✅ Ejecuta `npm run seed`
5. ✅ Ejecuta `npm run dev`
6. ✅ Abre http://localhost:3000 en tu navegador
7. ✅ ¡Prueba la app!

---

## 📚 Recursos

- [Node.js Documentation](https://nodejs.org/docs/)
- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)

---

## ❓ ¿Problemas?

Si encuentras problemas durante la instalación:

1. Lee la sección de **Troubleshooting** arriba
2. Verifica que todos los requisitos previos estén instalados
3. Abre un issue en GitHub: https://github.com/maoyinggomez/rutascafetero/issues

---

**¡Listo! Ahora puedes desarrollar y contribuir a Rutas Cafetero** ☕🏔️
