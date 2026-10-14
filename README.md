# IUB Auxiliary API

Servicio Express independiente para la funcionalidad auxiliar de notificaciones.
Usa MySQL exclusivamente y reutiliza el JWT firmado por la API FastAPI.

## Preparacion

Requiere Node.js 20 o posterior y MySQL 8 o posterior.

```powershell
npm install
Copy-Item .env.example .env
```

Configura en `.env` la conexion MySQL y copia la misma `JWT_SECRET_KEY` de la API FastAPI.
No uses `DATABASE_URL`, porque pertenece exclusivamente a PostgreSQL.

Variables minimas de MySQL:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=iub_auxiliar
MYSQL_USER=root
MYSQL_PASSWORD=tu_password
```

La aplicacion crea un pool mediante `mysql2/promise` usando exclusivamente estas variables.

Ejecuta el esquema conectado a la base configurada en `MYSQL_DATABASE`:

```powershell
npm run db:init
```

El comando usa `database/01_schema.sql` y las credenciales de `.env`. Después inicia el servicio:

```powershell
npm run dev
```

Endpoints iniciales:

- `GET /health`
- `GET /docs`
- `GET /api/v1/aux/notificaciones`
- `POST /api/v1/aux/notificaciones`
- `GET /api/v1/aux/notificaciones/:publicId`
- `POST /api/v1/aux/notificaciones/:publicId/intentos`
- `PATCH /api/v1/aux/notificaciones/:publicId/estado`

Los endpoints de notificaciones requieren `Authorization: Bearer <token>`.
El campo `usuario_public_id` siempre se obtiene del claim `sub`; no se acepta desde el body.

## Arquitectura

```text
FastAPI :8000 -> PostgreSQL
Express :3000 -> MySQL
```

`requirements.txt` se conserva solo como referencia de las dependencias Node.js.
La fuente oficial es `package.json` y la instalacion se realiza con npm.
