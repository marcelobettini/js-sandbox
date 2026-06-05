// Punto de entrada: configura Express y arranca el servidor.

import express from 'express';
import cookieParser from 'cookie-parser';
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import healthRouter from './routes/health.js';
import { connectDB } from './db/mongoClient.js';
import { ensureIndexes } from './db/usersStore.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

const API_PREFIX = '/api/v1';

// Ruta raíz: info de la API
app.get(API_PREFIX, (req, res) => {
  res.json({
    name: 'Todo API',
    version: '1.0.0',
    endpoints: {
      [`GET    ${API_PREFIX}/tasks`]: 'Lista todas las tareas (filtra con ?completed=true|false o ?search=keyword)',
      [`GET    ${API_PREFIX}/tasks/:id`]: 'Obtiene una tarea por id',
      [`POST   ${API_PREFIX}/tasks`]: 'Crea una nueva tarea [auth requerida]',
      [`PATCH  ${API_PREFIX}/tasks/:id`]: 'Actualiza una tarea parcialmente [auth requerida]',
      [`PATCH  ${API_PREFIX}/tasks/:id/toggle`]: 'Invierte el estado completed de una tarea [auth requerida]',
      [`DELETE ${API_PREFIX}/tasks/:id`]: 'Elimina una tarea [auth requerida]',
      [`POST   ${API_PREFIX}/auth/register`]: 'Registra un usuario nuevo',
      [`POST   ${API_PREFIX}/auth/login`]: 'Inicia sesión, devuelve access token',
      [`POST   ${API_PREFIX}/auth/refresh`]: 'Rota el refresh token y emite un nuevo access token',
      [`POST   ${API_PREFIX}/auth/logout`]: 'Cierra sesión (limpia la cookie del refresh token)',
    },
  });
});

app.use(`${API_PREFIX}/tasks`, tasksRouter);
app.use(`${API_PREFIX}/auth`, authRouter);
app.use('/health', healthRouter);

// 404 — rutas no definidas
app.use((req, res, next) => {
  const error = new Error('Route not found');
  error.status = 404;
  next(error); // delega al error handler global
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);

  const status = err.status || err.statusCode || 500;
  //Por qué usamos las props status o statusCode?
  //Es para garantizar compatibilidad con distintos tipos de errores: algunos frameworks o librerías (como http-errors) usan err.status, mientras que otros (como los errores nativos de Node) podrían usar err.statusCode. Al verificar ambos, nos aseguramos de capturar el código de estado correcto sin importar el origen del error. Es un seguro barato para mejorar la robustez de nuestro error handling. Programación Defensiva 101: anticipar variaciones en los objetos de error que podríamos recibir.
  //

  const message = status < 500 ? err.message : 'Internal server error';
  //                              ↑ no exponer detalles internos en errores 5xx

  res.status(status).json({ error: message });
});

// Conectar a MongoDB antes de abrir el puerto.
// Si la conexión falla no tiene sentido arrancar el servidor — process.exit(1)
// asegura un fallo rápido y visible en lugar de quedar en estado roto silencioso.
async function main() {
  await connectDB();
  await ensureIndexes(); // índice único sobre users.email
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
