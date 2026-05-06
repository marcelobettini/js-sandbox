// Punto de entrada: configura Express y arranca el servidor.

import express from 'express';
import tasksRouter from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Parsea el body de las requests como JSON
app.use(express.json());

// Ruta raíz: info de la API
app.get('/', (req, res) => {
  res.json({
    name: 'Todo API',
    version: '1.0.0',
    endpoints: {
      'GET    /tasks': 'Lista todas las tareas (filtra con ?completed=true|false o ?search=keyword)',
      'GET    /tasks/:id': 'Obtiene una tarea por id',
      'POST   /tasks': 'Crea una nueva tarea',
      'PATCH  /tasks/:id': 'Actualiza una tarea parcialmente',
      'PATCH  /tasks/:id/toggle': 'Invierte el estado completed de una tarea',
      'DELETE /tasks/:id': 'Elimina una tarea',
    },
  });
});

// Monta el router de tareas en /tasks
app.use('/tasks', tasksRouter);

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
