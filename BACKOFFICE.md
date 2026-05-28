# Backoffice SGSMA 2026

Panel de administración para gestionar el contenido de la app móvil.
Corre como contenedor independiente (`admin/`) conectado al mismo MongoDB que `api/`.

---

## 1. Contexto y decisiones de diseño

| Decisión | Opción elegida | Razón |
|---|---|---|
| ¿Dónde vive? | Contenedor separado `admin/` | `api/` se mantiene como REST puro para la app |
| ¿Auth propia? | Sí — login independiente | El sistema de inscripciones tiene su propio login, no se mezclan |
| ¿Tokens? | JWT con `role: admin` | Mismo `JWT_SECRET`, misma blacklist Redis, flujo conocido |
| ¿UI? | Server-rendered (Express + EJS) | Sin build step, sin framework frontend, suficiente para un congreso |
| ¿Puerto? | 8192 (dev) / 127.0.0.1:8192 (prod) | No expuesto públicamente en producción |

---

## 2. Estructura de carpetas

```
admin/
├── Dockerfile
├── Dockerfile.dev
├── package.json
└── src/
    ├── app.js                ← Express + sesiones + rutas
    ├── config.js             ← variables de entorno
    ├── db/
    │   └── mongo.js          ← mismo patrón que api/
    ├── middleware/
    │   └── auth.js           ← verifica JWT admin en cada request
    ├── routes/
    │   ├── auth.js           ← GET /login, POST /login, POST /logout
    │   ├── events.js         ← CRUD /events
    │   ├── speakers.js       ← CRUD /speakers
    │   ├── papers.js         ← CRUD /papers
    │   ├── announcements.js  ← CRUD /announcements
    │   └── content.js        ← POST /content/republish (actualiza hash)
    └── views/
        ├── layout.ejs
        ├── login.ejs
        ├── events/
        │   ├── index.ejs     ← lista
        │   └── form.ejs      ← crear / editar
        ├── speakers/
        ├── papers/
        └── announcements/
```

---

## 3. Autenticación

### Flujo

```
Usuario abre /login
    → ingresa usuario + contraseña
    → POST /auth/login
    → backend verifica ADMIN_USER + ADMIN_PASS_HASH (bcrypt)
    → genera JWT { sub: 'admin', role: 'admin', jti }
    → guarda token en cookie httpOnly
    → redirige a /events
```

### JWT

Mismo `JWT_SECRET` que la API móvil. El payload lleva `role: 'admin'`.
La blacklist de Redis es compartida — el logout invalida el token en ambos sistemas.

```js
// Payload del token admin
{
  sub: 'admin',
  role: 'admin',
  jti: 'uuid-v4',
  iat: ...,
  exp: ...   // TTL configurable, sugerido: 8h
}
```

### Middleware de protección

```js
// middleware/auth.js
export function requireAdmin(req, res, next) {
  const token = req.cookies?.admin_token
  if (!token) return res.redirect('/login')

  try {
    const payload = jwt.verify(token, config.JWT_SECRET)
    if (payload.role !== 'admin') throw new Error()
    // verificar blacklist Redis
    req.user = payload
    next()
  } catch {
    res.clearCookie('admin_token')
    res.redirect('/login')
  }
}
```

---

## 4. Rutas

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/login` | Muestra formulario de login |
| `POST` | `/login` | Verifica credenciales → cookie JWT → redirect `/events` |
| `POST` | `/logout` | Blacklist JWT + limpia cookie → redirect `/login` |

### Eventos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/events` | Lista todos los eventos agrupados por día |
| `GET` | `/events/new` | Formulario crear evento |
| `POST` | `/events` | Crea evento en MongoDB |
| `GET` | `/events/:id/edit` | Formulario editar evento |
| `PUT` | `/events/:id` | Actualiza evento + invalida caché Redis |
| `DELETE` | `/events/:id` | Elimina evento + invalida caché Redis |

### Speakers

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/speakers` | Lista speakers por rol |
| `GET` | `/speakers/new` | Formulario crear speaker |
| `POST` | `/speakers` | Crea speaker |
| `GET` | `/speakers/:id/edit` | Formulario editar |
| `PUT` | `/speakers/:id` | Actualiza speaker |
| `DELETE` | `/speakers/:id` | Elimina speaker |

### Papers

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/papers` | Lista papers agrupados por sesión |
| `GET` | `/papers/new` | Formulario crear paper |
| `POST` | `/papers` | Crea paper |
| `GET` | `/papers/:id/edit` | Formulario editar |
| `PUT` | `/papers/:id` | Actualiza paper |
| `DELETE` | `/papers/:id` | Elimina paper |

### Anuncios ← lo más usado en tiempo real

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/announcements` | Lista anuncios (más reciente primero) |
| `GET` | `/announcements/new` | Formulario crear anuncio |
| `POST` | `/announcements` | Crea anuncio + publica en MQTT `sgsma/announcements` |
| `DELETE` | `/announcements/:id` | Elimina anuncio |

### Contenido

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/content/republish` | Actualiza hash en `content_meta` → la app detecta cambios |

---

## 5. Invalidación de caché Redis

Cada vez que se modifica un evento, el backoffice debe invalidar las keys de Redis correspondientes para que la API sirva datos frescos:

```js
// Al crear / editar / eliminar un evento del día N:
await redis.del('schedule:all')
await redis.del(`schedule:day:${event.day}`)

// Al publicar un anuncio:
// (anuncios no tienen caché — siempre se sirven desde MongoDB)

// Al llamar a /content/republish:
const newHash = crypto.randomUUID().replace(/-/g, '')
await db.collection('content_meta').updateOne({}, {
  $set: { hash: newHash, updatedAt: new Date().toISOString() }
})
await redis.del('content:version')
```

---

## 6. Stack y dependencias

```json
{
  "dependencies": {
    "express": "^4.19",
    "express-async-errors": "^3",
    "cookie-parser": "^1.4",
    "ejs": "^3.1",
    "bcryptjs": "^2.4",
    "jsonwebtoken": "^9",
    "mongodb": "^6",
    "ioredis": "^5",
    "mqtt": "^5",
    "uuid": "^10",
    "method-override": "^3"
  }
}
```

> `method-override` permite usar `PUT` y `DELETE` desde formularios HTML con `?_method=PUT`.

---

## 7. Agregar al docker-compose.yml (dev)

```yaml
admin:
  build:
    context: ./admin
    dockerfile: Dockerfile.dev
  container_name: sgsma26_admin
  restart: unless-stopped
  ports:
    - "8192:3002"
  environment:
    PORT: 3002
    MONGO_URL: mongodb://mongo:27017
    DB_NAME: ${DB_NAME:-sgsma2026}
    REDIS_URL: redis://redis:6379
    MQTT_HOST: mqtt
    MQTT_PORT: 1883
    JWT_SECRET: ${JWT_SECRET:-dev_secret_change_in_prod}
    ADMIN_USER: ${ADMIN_USER:-admin}
    ADMIN_PASS_HASH: ${ADMIN_PASS_HASH}
    NODE_ENV: development
  volumes:
    - ./admin/src:/app/src
  depends_on:
    - mongo
    - redis
    - mqtt
```

En **producción** (`docker-compose.prod.yml`):

```yaml
admin:
  build:
    context: ./admin
    dockerfile: Dockerfile
  container_name: sgsma26_admin
  restart: unless-stopped
  ports:
    - "127.0.0.1:8192:3002"   # solo loopback — no expuesto al público
  ...
```

El nginx externo de producción **no** apunta al puerto 8192. El acceso es solo vía SSH tunnel:

```bash
# Desde tu máquina local
ssh -L 8192:localhost:8192 usuario@servidor
# Luego abres http://localhost:8192 en el navegador
```

---

## 8. Orden de implementación sugerido

- [ ] Scaffold `admin/` con Express + EJS + cookie-parser
- [ ] `GET /login` y `POST /login` con bcrypt + JWT en cookie
- [ ] Middleware `requireAdmin` aplicado a todas las rutas excepto `/login`
- [ ] CRUD Anuncios (es lo más urgente para el día del congreso)
- [ ] CRUD Eventos (editar horarios, locations)
- [ ] CRUD Speakers
- [ ] CRUD Papers
- [ ] Botón "Republicar contenido" (actualiza hash)
- [ ] Agregar al docker-compose dev y prod
