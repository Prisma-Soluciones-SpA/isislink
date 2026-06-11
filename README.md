# ISISLINK - App de Citas Esotérica

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend Mobile | Ionic 7 + Angular 20 + Capacitor |
| Backend API | Node.js + Express 4 |
| Base de Datos | PostgreSQL + Sequelize |
| Real-time | Socket.io |
| Pagos | Transbank WebPay Plus |
| Imágenes | Multer (almacenamiento local VPS) |

---

## Instalación - Backend

```bash
cd backend
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL y Transbank
npm install
npm run dev
```

### Crear base de datos PostgreSQL
```sql
CREATE DATABASE isislink;
```

El servidor sincroniza los modelos automáticamente al iniciar.

---

## Instalación - Frontend

```bash
cd frontend
npm install
ionic serve          # Desarrollo web
```

### Compilar APK Android
```bash
cd frontend
ionic build
npx cap sync android
npx cap open android   # Abre Android Studio
# En Android Studio: Build > Generate Signed APK
```

### Compilar iOS
```bash
cd frontend
ionic build
npx cap sync ios
npx cap open ios       # Abre Xcode
```

---

## Variables de Entorno (.env)

```env
# Base de datos
DB_HOST=localhost
DB_PORT=5432
DB_NAME=isislink
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD

# JWT
JWT_SECRET=clave_super_secreta_larga

# Transbank (dejar vacío para modo integración/testing)
TBK_ENVIRONMENT=integration   # o "production" en producción
TBK_COMMERCE_CODE=            # Solo en producción
TBK_API_KEY=                  # Solo en producción
TBK_RETURN_URL=https://tu-vps.com/api/subscriptions/confirm

# URL del frontend (para CORS)
FRONTEND_URL=https://tu-vps.com
```

---

## Despliegue en VPS

### Backend con PM2
```bash
npm install -g pm2
cd backend
pm2 start src/app.js --name isislink-api
pm2 save
pm2 startup
```

### Nginx reverse proxy
```nginx
server {
    listen 80;
    server_name tu-dominio.com;
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
    
    location /uploads {
        proxy_pass http://localhost:3000;
    }
    
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

---

## Planes de Suscripción

| Plan | Likes/mes | Precio CLP |
|------|-----------|-----------|
| Freemium | 10 | Gratis |
| Básico | 50 | $3.990 |
| Medio | 250 | $5.990 |
| Premium | Ilimitados | $10.990 |

- Mujeres: acceso gratuito ilimitado
- Hombres: freemium 10 likes, luego suscripción mensual

---

## API Endpoints

```
POST /api/auth/register     - Registro de usuario
POST /api/auth/login        - Inicio de sesión
GET  /api/auth/me           - Perfil actual
PUT  /api/auth/profile      - Actualizar perfil

GET  /api/discover/suggestions  - Sugerencias de perfiles
POST /api/discover/like         - Dar like

GET  /api/matches              - Lista de matches
GET  /api/matches/:id          - Match específico

GET  /api/messages/:matchId    - Mensajes de un chat
POST /api/messages/:matchId    - Enviar mensaje

GET  /api/tips                 - Tips esotéricos
POST /api/tips                 - Crear tip (admin)

GET  /api/subscriptions/plans  - Planes disponibles
GET  /api/subscriptions/status - Estado de suscripción
POST /api/subscriptions/init   - Iniciar pago Transbank
POST /api/subscriptions/confirm - Confirmar pago (callback)
```
