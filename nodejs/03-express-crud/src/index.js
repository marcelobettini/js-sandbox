// Punto de entrada: configura Express y arranca el servidor.

import express from 'express';
import tasksRouter from './routes/tasks.js';

const app = express();
const PORT = process.env.PORT || 3000;

// eliminamos la cabecera "X-Powered-By" por seguridad (no revelar que usamos Express)
app.disable("x-powered-by");

// Parsea el body de las solicitudes. Estas llegan en formato JSON, así que usamos express.json() para convertirlo a objeto JS.
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


// 404 para rutas no definidas: crea un error y lo delega al manejador global.
// Usar next(err) en vez de responder aquí mantiene un único punto de salida para errores.

app.use((req, res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  next(err);
});

/*
Manejador global de errores (4 parámetros = Express lo reconoce como error handler).
Lee err.status para devolver el código correcto (404, 422, etc.) y cae a 500 si no hay ninguno. Damos un 500 para errores inesperados, pero para errores controlados (como "Tarea no encontrada") el router debería asignar un status adecuado (404, 422, etc.) al error antes de pasarlo aquí. Esto asegura que el cliente reciba un mensaje claro y un código HTTP correcto según la situación. Para lanzar un error controlado desde el router, se puede hacer algo como:

const err = new Error('Tarea no encontrada');
err.status = 404;
next(err);

*/

app.use((err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
