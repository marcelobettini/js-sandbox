# Plan de Migración: fileStore.js → MongoDB Atlas

## Contexto

La API usa actualmente un archivo JSON como base de datos (fileStore.js). El objetivo es reemplazarlo por MongoDB Atlas usando el **driver oficial de Node.js** (`mongodb`, sin Mongoose). La interfaz pública del store se mantiene igual; lo que cambia es que todas las operaciones pasan a ser asíncronas.

---

## Prerequisitos (ya completados)

- [x] Driver instalado: `npm install mongodb` (v7.x, ver `package.json`)
- [x] URI de conexión en `.env`: variable `MONGODB_URI`
- [x] `npm run dev` carga `.env` automáticamente via `--env-file` (flag de Node.js ≥ 20.6)

> **Nota:** `npm start` **no** carga `.env`. En producción se asume que las variables de entorno son inyectadas externamente (plataforma de hosting, CI/CD). Es el comportamiento correcto.

---

## Decisiones de diseño

### `_id` como UUID string

MongoDB usa `_id` como clave primaria. En lugar de mantener un campo `id` (UUID) paralelo al `_id` que MongoDB generaría como `ObjectId`, vamos a **usar el UUID como `_id`**. Esto evita duplicar la clave, aprovecha el índice primario y mantiene la misma semántica del modelo.

Al devolver documentos, el store mapea `{ _id, ...rest }` → `{ id: _id, ...rest }` para que el router siga recibiendo `id` sin cambios.

### Filtros en el store, no en el router

Actualmente `GET /tasks` trae todos los documentos a memoria y filtra en JavaScript. Con MongoDB conviene enviar los filtros al servidor. `getAll()` recibirá `{ completed, search }` y construirá la query internamente — el router solo pasa `req.query`.

### Conexión singleton

El `MongoClient` se inicializa una sola vez en `connectDB()`, que se llama al arrancar el servidor. El resto del código accede a la DB via `getDb()`. Si se llama antes de conectar, lanza un error explícito.

---

## Pasos

### Paso 1 — Crear `src/db/mongoClient.js` *(archivo nuevo)*

Módulo de conexión. Responsabilidades: leer `MONGODB_URI`, crear el cliente, conectar, y exponer los accessors.

```js
import { MongoClient } from 'mongodb';

const DB_NAME = 'todoAPI';
let db;

export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Conectado a MongoDB Atlas — base de datos: ${DB_NAME}`);
}

// Lanza si se llama antes de connectDB() — fallo rápido y explícito
export function getDb() {
  if (!db) throw new Error('DB no inicializada. Llamá a connectDB() primero.');
  return db;
}
```

**Por qué separar `connectDB()` y `getDb()`:** `connectDB` es asíncrona y solo se llama una vez al inicio. `getDb` es síncrona y la llaman las funciones del store en cada operación. Separar las responsabilidades evita tener que `await` en cada acceso a la colección.

---

### Paso 2 — Crear `src/db/mongoStore.js` *(archivo nuevo)*

Reemplaza `fileStore.js`. Misma interfaz pública, todo `async`. Usa `getDb()` para obtener la colección `tasks`.

**Helper interno para normalizar documentos:**

```js
// Convierte { _id: uuid, ...campos } → { id: uuid, ...campos }
// MongoDB usa _id como PK; el router espera id
function toTask(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}
```

**Tabla de operaciones:**

| Función | Operación MongoDB |
|---|---|
| `getAll({ completed, search })` | `find(query).toArray()` con filtros opcionales |
| `getById(id)` | `findOne({ _id: id })` |
| `add(task)` | `insertOne({ _id: id, ...rest })` |
| `update(id, fields)` | `findOneAndUpdate({ _id: id }, { $set: fields }, { returnDocument: 'after' })` |
| `remove(id)` | `deleteOne({ _id: id })` → `deletedCount === 1` |

**Detalles de `add`:** el router construye el task con `id: uuid`. Antes de insertar hay que renombrar ese campo a `_id`:

```js
export async function add(task) {
  const { id, ...rest } = task;
  const col = getDb().collection('tasks');
  await col.insertOne({ _id: id, ...rest });
}
```

**Detalles de `getAll` con filtros:**

```js
export async function getAll({ completed, search } = {}) {
  const query = {};

  if (completed !== undefined) {
    query.completed = completed === 'true';
  }

  if (search) {
    // Escapar caracteres especiales de regex para evitar regex injection
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const col = getDb().collection('tasks');
  const docs = await col.find(query).toArray();
  return docs.map(toTask);
}
```

> **Seguridad:** el input del usuario nunca debe pasarse directamente a un `RegExp` sin escapar — un valor como `.*` o `(a+)+` puede causar ReDoS (denegación de servicio por regex). La línea de escape resuelve esto.

**Detalles de `findOneAndUpdate`:** en el driver v5+, la función devuelve el documento directamente (no en `.value` como en versiones anteriores). Si no se encuentra el documento devuelve `null`.

```js
export async function update(id, fields) {
  const col = getDb().collection('tasks');
  const doc = await col.findOneAndUpdate(
    { _id: id },
    { $set: fields },
    { returnDocument: 'after' }  // devuelve el doc ya actualizado
  );
  return toTask(doc); // toTask maneja null si no se encontró
}
```

---

### Paso 3 — Modificar `src/routes/tasks.js`

Cambios puntuales:

1. **Cambiar import:** `'../db/fileStore.js'` → `'../db/mongoStore.js'`
2. **Handlers `async`:** cada handler pasa de `(req, res)` a `async (req, res, next)`
3. **`try/catch` en cada handler:** errores de DB se pasan a `next(err)` — el error handler global de `index.js` los captura
4. **Simplificar `GET /tasks`:** eliminar el filtrado en JS; pasar `req.query` directamente a `getAll()`

**Ejemplo — antes / después de `GET /tasks`:**

```js
// ANTES (síncrono, filtra en JS)
router.get('/', (req, res) => {
  let tasks = getAll();
  if (completed !== undefined) tasks = tasks.filter(...);
  if (search) tasks = tasks.filter(...);
  res.json(tasks);
});

// DESPUÉS (asíncrono, filtra en MongoDB)
router.get('/', async (req, res, next) => {
  try {
    const { completed, search } = req.query;
    const tasks = await getAll({ completed, search });
    if (!tasks.length) return res.status(404).json({ error: 'Task not found' });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});
```

El mismo patrón `async/await + try/catch + next(err)` aplica a todos los demás handlers.

---

### Paso 4 — Modificar `src/index.js`

Cambios:

1. **Importar `connectDB`** desde `'./db/mongoClient.js'`
2. **Eliminar** `console.log(process.env.MONGODB_URI)` — nunca loguear credenciales
3. **Conectar antes de escuchar:** envolver el arranque en una función `async` que primero conecta y luego llama a `app.listen()`

```js
// Patrón recomendado
async function main() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1); // si MongoDB no conecta, no tiene sentido mantener el proceso vivo
});
```

**Por qué `process.exit(1)` en el catch:** si la conexión a MongoDB falla al arrancar, el servidor no puede servir ningún request útil. Mejor fallar rápido y visible que quedar en un estado roto silencioso.

---

### Paso 5 — Agregar `GET /health` *(archivo nuevo + modificación de `index.js`)*

Endpoint de salud que chequea dos cosas de forma independiente: que el proceso Express está vivo, y que la conexión a MongoDB responde. Es infraestructura, no dominio — va montado en el app directamente, fuera del prefijo `/api/v1`.

**Crear `src/routes/health.js`:**

```js
import { Router } from 'express';
import { getDb } from '../db/mongoClient.js';

const router = Router();

// GET /health
// Responde 200 si todo está bien, 503 si MongoDB no responde.
// No delega a next(err): este handler siempre devuelve una respuesta
// estructurada, incluso cuando algo falla — es lo que esperan los
// health checks de load balancers y orquestadores (k8s, Railway, etc.)
router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();

  try {
    // ping es el comando más liviano de MongoDB; no toca datos
    await getDb().command({ ping: 1 });
    res.json({ status: 'ok', db: 'ok', timestamp });
  } catch (err) {
    // 503 Service Unavailable: el servidor corre pero su dependencia crítica no responde
    res.status(503).json({ status: 'error', db: 'unreachable', timestamp });
  }
});

export default router;
```

**Por qué 503 y no 500:** 500 indica un error interno inesperado en el servidor. 503 indica que el servicio está temporalmente no disponible — la semántica correcta cuando la DB no responde. Los proxies inversos y orquestadores (nginx, Kubernetes, Railway) leen el código HTTP del `/health` para decidir si sacar la instancia de rotación; 503 les indica "no me mandes tráfico".

**Montar en `src/index.js`** (agregar junto a los demás imports y mounts):

```js
import healthRouter from './routes/health.js';

// ...

app.use('/health', healthRouter);  // antes del 404 handler
```

El endpoint queda en `GET /health` (sin prefijo `/api/v1` — es infraestructura, no parte de la API de negocio).

---

### Paso 6 — Retirar archivos del fileStore

Eliminar:
- `src/db/fileStore.js`
- `src/data/tasks.json`

---

### Paso 7 — Verificación

Iniciar con `npm run dev` y probar todos los endpoints. Verificar también en MongoDB Atlas (Collections) que los documentos se crean/modifican/eliminan correctamente.

```
GET    /health                          → { status, db, timestamp } — 200 ok / 503 si DB cae
POST   /api/v1/tasks                    → crear tarea
GET    /api/v1/tasks                    → listar todas
GET    /api/v1/tasks?completed=false    → filtrar por estado
GET    /api/v1/tasks?search=keyword     → búsqueda por texto
GET    /api/v1/tasks/:id                → obtener por id
PATCH  /api/v1/tasks/:id                → actualización parcial
PATCH  /api/v1/tasks/:id/toggle         → invertir completed
DELETE /api/v1/tasks/:id                → eliminar
```

Para probar el caso de fallo del health check, se puede apagar temporalmente el acceso a Atlas (Network Access → eliminar la IP) y verificar que la respuesta pase a `503`.

---

## Resumen de archivos

| Archivo | Estado |
|---|---|
| `src/db/mongoClient.js` | Nuevo |
| `src/db/mongoStore.js` | Nuevo |
| `src/routes/health.js` | Nuevo |
| `src/routes/tasks.js` | Modificado (async, nuevo import) |
| `src/index.js` | Modificado (connectDB, health mount, sin log de credenciales) |
| `src/db/fileStore.js` | Eliminado |
| `src/data/tasks.json` | Eliminado |
