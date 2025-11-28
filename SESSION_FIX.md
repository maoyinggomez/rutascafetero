# 🔧 SOLUCIÓN: Problema de Sesión que no Persiste

## Problema Identificado

Cuando un usuario se registraba como anfitrión y cerraba la app, al abrir de nuevo **no estaba autenticado y tenía que registrarse de nuevo**.

### Causa Raíz

El problema estaba en 3 lugares:

1. **React Query tenía `staleTime: Infinity`**
   - Esto cachea datos indefinidamente sin refetch
   - Pero no sincronizaba correctamente con el token en localStorage

2. **La query key no incluía el token**
   - `queryKey: ["/api", "auth", "me"]` 
   - Debería ser: `queryKey: ["/api", "auth", "me", token]`
   - Esto asegura que cuando el token cambia, se hace un nuevo fetch

3. **Falta de estado de inicialización**
   - La app intentaba hacer refetch antes de que localStorage fuera cargado
   - Causaba race conditions

## Cambios Realizados

### 1. `client/src/lib/auth.tsx`

✅ Añadido estado `isInitialized` para coordinar el timing
✅ Actualizada query key para incluir el token: `["/api", "auth", "me", token]`
✅ Cambiado `staleTime` de `Infinity` a `30 minutos`
✅ Mejorado efecto de refetch para esperar inicialización

### 2. `client/src/lib/queryClient.ts`

✅ Actualizada configuración global de queries
✅ Cambiado `staleTime` de `Infinity` a `5 minutos`
✅ Añadida lógica de retry mejorada
✅ No reintentar en errores 401 (unauthorized)

### 3. `client/src/App.tsx`

✅ Añadida ruta `/debug` para depuración

## Cómo Probar

1. Ve a `http://localhost:3000/register`
2. Registrate como **anfitrión**
3. Deberías estar autenticado
4. Abre `http://localhost:3000/debug` para ver el estado
5. **Recarga la página (F5)** - deberías seguir autenticado
6. **Cierra el navegador completamente**
7. **Abre el navegador de nuevo** - deberías seguir autenticado
8. Si no funciona, ve a `/debug` para ver qué está pasando

## Flujo Ahora (Corregido)

```
1. Usuario registra
   ↓
2. Servidor devuelve: { user, token }
   ↓
3. Cliente guarda token en localStorage
   ↓
4. React Query hace refetch de /api/auth/me con token
   ↓
5. Servidor verifica token y devuelve usuario
   ↓
6. Cliente cachea usuario por 30 minutos
   ↓
7. Usuario recarga página
   ↓
8. Cliente lee token de localStorage
   ↓
9. React Query ve que token cambió (ahora sí está en la queryKey)
   ↓
10. Hace refetch automático de /api/auth/me
    ↓
11. Usuario sigue autenticado ✅
```

## Si Sigue Sin Funcionar

Comprueba en la consola del navegador (F12):

1. ¿Está el token en localStorage?
2. ¿Se está haciendo el request a `/api/auth/me`?
3. ¿Devuelve error 401?
4. ¿El servidor recibe el header `Authorization`?

Usa la página `/debug` para investigar.
