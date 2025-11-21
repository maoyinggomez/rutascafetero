# Guía de Carga de Imágenes para Rutas

## Descripción General

La plataforma ahora permite que los anfitriones suban imágenes directamente desde sus computadoras en lugar de usar URLs. Las imágenes se almacenan localmente en el servidor.

## Características

- ✅ Carga de archivos desde el formulario
- ✅ Vista previa de imagen antes de guardar
- ✅ Validación de tipo de archivo (JPG, PNG, WebP, GIF)
- ✅ Límite de tamaño: 5MB por imagen
- ✅ Eliminación automática de imágenes al eliminar rutas
- ✅ Alternativa: usar URLs si prefieres

## Flujo de Uso

### 1. Crear una Nueva Ruta

1. Inicia sesión como **Anfitrión** o **Admin**
2. Accede al panel de administración
3. Haz clic en "Crear Nueva Ruta"
4. Completa los campos:
   - Nombre de la ruta
   - Descripción detallada
   - Destino
   - Dificultad
   - Duración (texto y horas)
   - Precio total y por persona
   - Cupo máximo
   - Tags
   - Puntos de interés

### 2. Subir Imagen

Hay dos opciones:

#### Opción A: Subir archivo
1. En la sección "Imagen de la Ruta"
2. Haz clic en el área de drag-and-drop
3. Selecciona una imagen de tu computadora
4. Verás una vista previa
5. La imagen se sube con el formulario

#### Opción B: Usar URL
1. Si no subes archivo, puedes ingresar una URL
2. La URL debe ser válida
3. La imagen se guardará como URL

### 3. Actualizar Ruta

1. Abre una ruta existente
2. Para cambiar la imagen:
   - Sube un nuevo archivo, O
   - Ingresa una nueva URL
3. La imagen anterior se eliminará automáticamente
4. Guarda los cambios

### 4. Eliminar Ruta

- Cuando eliminas una ruta, la imagen se borra automáticamente del servidor

## Requisitos Técnicos

### Formatos Soportados
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### Límites
- **Tamaño máximo:** 5 MB
- **Ancho mínimo:** Sin límite (se redimensionará en frontend si es necesario)
- **Alto mínimo:** Sin límite

## Rutas API

### Crear Ruta con Imagen
```
POST /api/rutas
Content-Type: multipart/form-data
Authorization: Bearer {token}

data: {
  "nombre": "Valle del Cocora",
  "descripcion": "...",
  "destino": "Salento",
  "dificultad": "Moderado",
  "duracion": "6-8 horas",
  "duracionHoras": 7,
  "precio": 120000,
  "precioPorPersona": 120000,
  "cupoMaximo": 15,
  "tags": ["naturaleza", "senderismo"],
  "puntosInteres": ["Palmas de cera", "Bosque de niebla"]
}
imagen: <archivo binario>
```

### Actualizar Ruta
```
PATCH /api/rutas/{rutaId}
Content-Type: multipart/form-data
Authorization: Bearer {token}

data: {...datos actualizados}
imagen: <archivo binario opcional>
```

### Respuesta
```json
{
  "id": "9cf5a097-fe7d-4d0f-8b00-e8dffb937631",
  "nombre": "Valle del Cocora",
  "imagenUrl": "/uploads/Valle-del-Cocora-1700601599123.jpg",
  ...
}
```

## Almacenamiento

### Ubicación
- **Directorio:** `/client/public/uploads/`
- **URL pública:** `http://localhost:3000/uploads/nombre-archivo.jpg`
- **Ruta relativa:** `/uploads/nombre-archivo.jpg`

### Estructura de Nombres
```
nombre-original-timestamp.extension
ejemplo: Valle-1700601599123.jpg
```

## Restricciones de Permisos

### Anfitriones
- ✅ Pueden subir imágenes para sus rutas
- ✅ Pueden actualizar sus propias rutas
- ✅ Pueden ver solo sus rutas
- ❌ No pueden editar rutas de otros anfitriones

### Admins
- ✅ Pueden hacer todo
- ✅ Acceso completo

### Turistas
- ✅ Pueden ver las imágenes
- ❌ No pueden subir

## Manejo de Errores

### Archivo muy grande
```json
{
  "error": "La imagen no debe superar 5MB"
}
```

### Formato no permitido
```json
{
  "error": "Solo se permiten archivos de imagen (JPEG, PNG, WebP, GIF)"
}
```

### Sin permisos
```json
{
  "error": "No tienes permisos para actualizar esta ruta"
}
```

## Tips y Buenas Prácticas

### Optimización de Imágenes
- **Comprime imágenes antes de subir** para mejorar carga
- **Usa formato WebP** si es posible (más pequeño que JPG)
- **Dimensiones recomendadas:** 800x600 o mayor
- **Ratio recomendado:** 4:3 o 16:9

### Nombres de Archivo
- Usa nombres descriptivos
- Evita caracteres especiales
- El sistema genera nombres únicos automáticamente

### URLs Externas
- Si usas URLs, asegúrate de que sean permanentes
- Usa CDN si es posible para mejor rendimiento
- Evita URLs de redes sociales

## Solución de Problemas

### La imagen no se sube
- Verifica que sea menor a 5MB
- Comprueba que sea un formato válido (JPG, PNG, WebP, GIF)
- Intenta recargar la página

### La imagen no aparece en la ruta
- Verifica que la URL sea correcta
- Comprueba permisos del archivo
- Revisa la consola del navegador para errores

### Error de permisos al actualizar
- Verifica que sea tu ruta (como anfitrión)
- Solo admins pueden editar rutas de otros

---

**Última actualización:** 21 de Noviembre de 2025
