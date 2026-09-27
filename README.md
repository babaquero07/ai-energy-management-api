# AI Energy Management API

API REST para gestionar medidores eléctricos, lecturas de consumo, eventos operativos y detección de anomalías. El análisis combina un motor determinista (línea base, outliers y calidad de dato) con una explicación generada por Gemini.

Prefijo global: `/api`. El proceso escucha en `0.0.0.0` y el puerto es `PORT` (`3000` si no está definido). La URL que se imprime al arrancar sale de `API_URL`. CORS permite el origen `http://localhost:3001`.

## Tecnologías

| Capa                        | Tecnología                                                                                                |
| --------------------------- | --------------------------------------------------------------------------------------------------------- |
| Runtime                     | Node.js 22                                                                                                |
| Lenguaje                    | TypeScript 5.7                                                                                            |
| Framework                   | NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)                                  |
| Configuración               | `@nestjs/config` (lee `.env` al arrancar)                                                                 |
| Validación                  | `class-validator` y `class-transformer` (pipe global: whitelist, rechazo de campos extra, transformación) |
| Persistencia                | PostgreSQL 17 + TypeORM (`synchronize: true` crea o actualiza el esquema al arrancar)                     |
| Driver                      | `pg`                                                                                                      |
| IA                          | Google Gemini (`@google/genai`, modelo `gemini-3.7-flash`)                                                |
| Gestor de paquetes          | pnpm 11                                                                                                   |
| Tests                       | Jest + Supertest                                                                                          |
| Contenedor de base de datos | Docker Compose (`postgres:17-alpine`)                                                                     |
| CI                          | GitHub Actions                                                                                            |

## Arquitectura

Módulos NestJS registrados en `AppModule`:

```
AppModule
├── ConfigModule          variables de entorno globales
├── TypeOrmModule         conexión PostgreSQL y entidades
├── MetersModule          medidores, listado, detalle y lecturas
├── ReadingsModule        carga de lecturas desde CSV
├── EventsModule          carga de eventos desde CSV
├── AnomaliesModule       consulta y borrado de anomalías
├── DashboardModule       resumen operativo
└── AnalysisModule        detección determinista + explicación con IA
    ├── BaselineService           perfil horario, z-score y residual eléctrico
    ├── AnomalyDetectorService    tipo y severidad a partir de las señales
    └── AiService → GeminiProvider
```

Flujo de análisis:

1. `POST /api/ai/analyze` (un medidor) o `POST /api/ai/analyze/execute` (todos) cargan lecturas y eventos.
2. `BaselineService` compara cada hora contra el perfil horario del propio medidor y contra la relación `V × I × factor de potencia`.
3. `AnomalyDetectorService` clasifica la serie:
   - `DATA_QUALITY` si el residual eléctrico es malo y no hay outliers de consumo.
   - `FALSE_POSITIVE` si hay un evento `OPERATIONAL_CHANGE` o `SCHEDULED_OUTAGE` dentro de ±2 horas del tramo anómalo.
   - `REAL_ANOMALY` en el resto de detecciones.
4. Si hay detección, se persiste una anomalía con estado `DETECTED` y textos pendientes de IA.
5. `PATCH /api/ai/analysis/:id` pide a Gemini una explicación en español (`reason`, `evidence`, `recommended_action`) y pasa el estado a `COMPLETED`.

El proveedor de IA está abstraído en `AIProvider`. La implementación concreta es `GeminiProvider`.

## Modelo de datos

TypeORM sincroniza estas entidades al conectar. No hay migraciones.

| Tabla       | Clave de negocio                  | Relación                                                           |
| ----------- | --------------------------------- | ------------------------------------------------------------------ |
| `meters`    | `meter_id` único (`M-101`, …)     | 1:N con lecturas, eventos y anomalías                              |
| `readings`  | FK `meter_id` → `meters.meter_id` | consumo kWh, voltaje, corriente, factor de potencia, estado        |
| `events`    | FK `meter_id` → `meters.meter_id` | tipo y descripción operativos                                      |
| `anomalies` | FK `meter_id` → `meters.meter_id` | tipo, severidad, confianza, razón, acción y `analysis_data` (JSON) |

Borrar un medidor elimina en cascada sus lecturas, eventos y anomalías.

Estados de medidor usados en los datos de ejemplo: `Activo`, `Inactivo`, `Mantenimiento`.

Enums de anomalía:

- Tipo: `REAL_ANOMALY`, `EXPLAINABLE_ANOMALY`, `FALSE_POSITIVE`, `DATA_QUALITY`, `PENDING_ANALYSIS`
- Severidad: `LOW`, `MEDIUM`, `HIGH`, `PENDING`
- Estado: `DETECTED`, `ANALYZING`, `COMPLETED`, `FAILED`, `RESOLVED`

## Variables de entorno

Crea un archivo `.env` en la raíz (está en `.gitignore`). La configuración activa apunta a la base y a la API desplegadas. El bloque comentado es el de desarrollo local.

```env
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# API_URL
API_URL=https://ai-energy-management-api.onrender.com

# Gemini API Key
GEMINI_API_KEY=

# Development

# Docker database
# DB_HOST=localhost
# POSTGRES_USER=
# POSTGRES_PASSWORD=
# POSTGRES_DB=ai-energy-management-db

# Local API_URL
# API_URL=http://localhost:3000
```

| Variable | Uso |
| --- | --- |
| `PORT` | Puerto HTTP del proceso. Por defecto `3000`. |
| `DATABASE_URL` | Cadena de conexión que usa TypeORM (`postgresql://usuario:contraseña@host:5432/base`). En el despliegue apunta a Postgres en Render. La conexión lleva SSL con `rejectUnauthorized: false`, que Render exige. |
| `API_URL` | URL pública que se escribe en el log al arrancar (`${API_URL}/api`). En producción es `https://ai-energy-management-api.onrender.com`. En local, `http://localhost:3000`. Si no está definida, el valor por defecto es `http://localhost:3000`. |
| `GEMINI_API_KEY` | Clave de Google AI. Solo hace falta para `PATCH /api/ai/analysis/:id`. El resto de la API arranca sin ella. |
| `DB_HOST` | Host de Postgres para desarrollo. Comentada en el `.env` y en `AppModule`. Con Docker, `localhost`. |
| `POSTGRES_USER` | Usuario de la base local. La usa Docker Compose y, si se descomenta, TypeORM. |
| `POSTGRES_PASSWORD` | Contraseña de la base local. La usa Docker Compose y, si se descomenta, TypeORM. |
| `POSTGRES_DB` | Nombre de la base local (`ai-energy-management-db`). |

Para usar la base de Docker hay que comentar `DATABASE_URL` en el `.env`, descomentar `DB_HOST`, `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB`, y en `src/app.module.ts` cambiar la conexión de `url` a `host`, `username`, `password` y `database`.

## Despliegue local

Requisitos: Node.js 22, pnpm 11, Docker.

```bash
pnpm install
docker compose up -d
pnpm run start:dev
```

`docker compose up -d` levanta `ai-energy-management-db` (Postgres 17) y persiste los datos en el volumen `ai-energy-management_data`. La API queda en `http://localhost:3000/api`.

Otros scripts:

```bash
pnpm run start        # sin watch
pnpm run start:debug  # watch + inspector
pnpm run build
pnpm run start:prod   # node dist/main (requiere build previo)
pnpm run lint
pnpm run format
pnpm run test
pnpm run test:e2e
pnpm run test:cov
```

Para apagar la base: `docker compose down`. El volumen se conserva. `docker compose down -v` borra los datos.

## Seed

La base arranca vacía. TypeORM crea las tablas, pero los medidores, eventos y lecturas se cargan con tres endpoints. Hay que llamarlos **en este orden**: eventos y lecturas referencian `meter_id`, así que los medidores tienen que existir antes.

Los medidores salen de `src/meters/data/mocked-meters.ts` (12 medidores, `M-101` a `M-112`). Los eventos salen de `files/events.csv` (4 filas). Las lecturas salen de `files/readings.csv` (unas 4000 filas horarias) y se insertan en lotes de 500.

```bash
curl -X POST http://localhost:3000/api/meters/seed
curl -X POST http://localhost:3000/api/events/seed
curl -X POST http://localhost:3000/api/readings/seed
```

Respuestas esperadas:

```json
{ "message": "Meters seeded successfully" }
{ "message": "Events seeded successfully" }
{ "message": "Readings seeded successfully" }
```

Cada seed inserta filas nuevas. Volver a ejecutarlos duplica eventos y lecturas, y el de medidores falla por la restricción única de `meter_id`. Si necesitas recargar, vacía las tablas o recrea el volumen (`docker compose down -v`) y vuelve a sembrar en el mismo orden.

## Endpoints

Todas las rutas cuelgan de `/api`.

### Salud

| Método | Ruta   | Respuesta      |
| ------ | ------ | -------------- |
| `GET`  | `/api` | `Hello World!` |

### Medidores

| Método | Ruta                       | Descripción                                                                                    |
| ------ | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `POST` | `/api/meters/seed`         | Inserta los medidores de ejemplo.                                                              |
| `GET`  | `/api/meters`              | Lista medidores y conteos por estado (`actives`, `inactives`, `maintenances`, `total`).        |
| `GET`  | `/api/meters/:id`          | Detalle por `meter_id` (por ejemplo `M-104`): lectura actual, baseline, variación e historial. |
| `GET`  | `/api/meters/:id/readings` | Serie de lecturas del medidor, ordenada por timestamp ascendente.                              |

Query de `GET /api/meters` (todas opcionales):

| Parámetro  | Formato                                                  |
| ---------- | -------------------------------------------------------- |
| `meter_id` | texto, máximo 50 caracteres                              |
| `status`   | texto, máximo 50 (`Activo`, `Inactivo`, `Mantenimiento`) |
| `date`     | `yyyy-mm-dd`, filtra por `created_at`                    |

Ejemplo: `GET /api/meters?status=Activo&date=2026-07-25`

El detalle (`GET /api/meters/:id`) responde `404` si el medidor no existe. Si no tiene lecturas, el cálculo de la lectura actual falla: siembra readings antes de consultar el detalle.

### Eventos y lecturas

| Método | Ruta                 | Descripción                 |
| ------ | -------------------- | --------------------------- |
| `POST` | `/api/events/seed`   | Carga `files/events.csv`.   |
| `POST` | `/api/readings/seed` | Carga `files/readings.csv`. |

### Dashboard

| Método | Ruta                     | Descripción                                                                                                                                 |
| ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/dashboard/summary` | Medidores, consumo total (kWh), anomalías, anomalías de severidad `HIGH`, confianza media de la IA (%), fecha y estado del último análisis. |

### Anomalías

| Método   | Ruta                 | Descripción                                                                          |
| -------- | -------------------- | ------------------------------------------------------------------------------------ |
| `GET`    | `/api/anomalies`     | Listado (`data`, `total`), más recientes primero.                                    |
| `GET`    | `/api/anomalies/:id` | Detalle numérico: incluye `reason`, `recommended_action` y `analysis_data`.          |
| `DELETE` | `/api/anomalies/:id` | Borra la anomalía. `{ "success": true, "message": "Anomaly deleted successfully" }`. |

`:id` es el entero autogenerado, no el `meter_id`.

### Análisis e IA

| Método  | Ruta                      | Cuerpo                    | Descripción                                                                     |
| ------- | ------------------------- | ------------------------- | ------------------------------------------------------------------------------- |
| `POST`  | `/api/ai/analyze`         | `{ "meter_id": "M-109" }` | Detecta sobre un medidor. `{ "detected": boolean, "anomaly": object \| null }`. |
| `POST`  | `/api/ai/analyze/execute` | —                         | Recorre todos los medidores. `{ "success": true }`.                             |
| `GET`   | `/api/ai/analysis/:id`    | —                         | Mismo detalle que `GET /api/anomalies/:id`.                                     |
| `PATCH` | `/api/ai/analysis/:id`    | —                         | Completa razón y acción con Gemini. Requiere `GEMINI_API_KEY`.                  |

## GitHub Actions

El workflow `.github/workflows/ci-cd.yml` (nombre `CI`) corre en `push` y `pull_request` hacia `master` y `develop`.

Job `test` en `ubuntu-latest`:

1. Checkout (`actions/checkout@v4`)
2. pnpm 11 (`pnpm/action-setup@v4`)
3. Node.js 22 con caché de pnpm (`actions/setup-node@v4`)
4. `pnpm install --frozen-lockfile`
5. `pnpm run lint`
6. `pnpm run format`
7. `pnpm run test`
8. `pnpm run test:e2e`
9. `pnpm run build`

Los tests unitarios y e2e no levantan Postgres: el e2e de análisis mockea TypeORM y los servicios de persistencia. El workflow no despliega la aplicación.

## Estructura relevante

```
src/
  main.ts                 prefijo /api, validación, CORS, puerto
  app.module.ts           Config y TypeORM
  meters/                 medidores y seed en memoria
  readings/               seed desde files/readings.csv
  events/                 seed desde files/events.csv
  anomalies/              CRUD de lectura y borrado
  dashboard/              resumen
  analysis/               detector, baseline y Gemini
files/
  events.csv
  readings.csv
docker-compose.yml
.github/workflows/ci-cd.yml
```
