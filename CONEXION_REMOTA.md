# 🚀 Guía para Acceder a la App desde Otra Máquina

## Problema: Los usuarios de mis compañeros no se guardan

**Causa:** Cada máquina tenía su propia base de datos o configuración diferente.

**Solución:** Todos usamos la MISMA base de datos Neon en la nube.

---

## ✅ Pasos para que tus compañeros accedan:

### 1️⃣ En la Máquina del Anfitrión (tu PC):

```bash
# Asegúrate de que el servidor está corriendo
npm run dev
```

El servidor ahora escucha en `0.0.0.0:3000`, lo que permite conexiones remotas.

### 2️⃣ Obtén tu IP Local

**En Windows (PowerShell):**
```powershell
ipconfig
```
Busca `IPv4 Address` (ej: `192.168.1.100`)

### 3️⃣ Comparte con tus Compañeros

Diles que accedan a:
```
http://TU_IP:3000
```

Por ejemplo:
```
http://192.168.1.100:3000
```

### 4️⃣ Los Compañeros Deben Clonar el Repo

Si aún no lo tienen:
```bash
git clone https://github.com/maoyinggomez/rutascafetero.git
cd rutascafetero
npm install
```

### 5️⃣ Configurar `.env` en Cada Máquina

Copiar `.env.example` a `.env`:
```bash
cp .env.example .env
```

**IMPORTANTE:** NO cambiar `DATABASE_URL` - debe ser IGUAL en todas las máquinas.

---

## 🎯 Resultado Final

✅ Todos usan la MISMA base de datos Neon  
✅ Los usuarios se guardan centralizadamente  
✅ Las rutas se sincronizan automáticamente  
✅ Las imágenes se guardan en BD como base64  
✅ Las reservas funcionan para todos

---

## 🔧 Solución de Problemas

**"No puedo acceder desde otra máquina"**
- Verifica que el host del anfitrión sea `0.0.0.0` en `.env`
- Confirma que estén en la misma red (WiFi o LAN)
- Revisa el firewall - puede bloquear el puerto 3000

**"Los usuarios no se guardan"**
- Asegúrate de que `DATABASE_URL` sea IGUAL en todas las máquinas
- Verifica la conexión a internet (se conecta a Neon en la nube)

**"Las imágenes no cargan"**
- Las imágenes se almacenan como base64 en la BD, no en archivos
- Deberían cargar automáticamente para todos
