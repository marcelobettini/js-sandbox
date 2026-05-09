// Punto de entrada: configura Express y arranca el servidor.

import express from 'express';
import tasksRouter from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Parsea el body de las requests como JSON

app.use(express.json());

const API_PREFIX = '/api/v1';

// Ruta raíz: info de la API
app.get(API_PREFIX, (req, res) => {
  res.json({
    name: 'Todo API',
    version: '1.0.0',
    endpoints: {
<<<<<<< HEAD
      'GET    /tasks': 'Lista todas las tareas (filtra con ?completed=true|false o ?search=keyword)',
      'GET    /tasks/:id': 'Obtiene una tarea por id',
      'POST   /tasks': 'Crea una nueva tarea',
      'PATCH  /tasks/:id': 'Actualiza una tarea parcialmente',
      'PATCH  /tasks/:id/toggle': 'Invierte el estado completed de una tarea',
      'DELETE /tasks/:id': 'Elimina una tarea',
=======
      [`GET    ${API_PREFIX}/tasks`]: 'Lista todas las tareas (filtra con ?completed=true|false o ?search=keyword)',
      [`GET    ${API_PREFIX}/tasks/:id`]: 'Obtiene una tarea por id',
      [`POST   ${API_PREFIX}/tasks`]: 'Crea una nueva tarea',
      [`PATCH  ${API_PREFIX}/tasks/:id`]: 'Actualiza una tarea parcialmente',
      [`PATCH  ${API_PREFIX}/tasks/:id/toggle`]: 'Invierte el estado completed de una tarea',
      [`DELETE ${API_PREFIX}/tasks/:id`]: 'Elimina una tarea',
>>>>>>> skeleton
    },
  });
});

// Monta el router de tareas bajo el prefijo /api/v1
app.use(`${API_PREFIX}/tasks`, tasksRouter);

// 404 para rutas no definidas
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Manejador global de errores (4 parámetros = Express lo reconoce como error handler)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
