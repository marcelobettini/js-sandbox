// Router de tareas: define la estructura de endpoints del CRUD.
// En esta rama (skeleton) los controladores solo muestran el comportamiento esperado.

import { Router } from 'express';

const router = Router();

// GET /api/v1/tasks
router.get('/', (req, res) => {
  res.json({ message: 'Se listarán todas las tareas (soportará filtros ?completed y ?search)' });
});

// GET /api/v1/tasks/:id
router.get('/:id', (req, res) => {
  res.json({ message: `Se mostrará la tarea con id: ${req.params.id}` });
});

// POST /api/v1/tasks
router.post('/', (req, res) => {
  res.status(201).json({ message: 'Se agregará la tarea con los datos del body' });
});

// PATCH /api/v1/tasks/:id
router.patch('/:id', (req, res) => {
  res.json({ message: `Se actualizará parcialmente la tarea con id: ${req.params.id}` });
});

<<<<<<< HEAD
// PATCH /tasks/:id/toggle → invierte el campo completed (true ↔ false)
// No requiere body: el nuevo valor se calcula a partir del estado actual.
router.patch('/:id/toggle', (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const updated = store.update(req.params.id, {
    completed: !task.completed,
    updatedAt: new Date().toISOString(),
  });

  res.json(updated);
});

// DELETE /tasks/:id → elimina una tarea
=======
// PATCH /api/v1/tasks/:id/toggle
// Invierte el campo completed (true → false, false → true) sin necesitar el estado actual en el body
router.patch('/:id/toggle', (req, res) => {
  res.json({ message: `Se invertirá el estado completed de la tarea con id: ${req.params.id}` });
});

// DELETE /api/v1/tasks/:id
>>>>>>> skeleton
router.delete('/:id', (req, res) => {
  res.json({ message: `Se eliminará la tarea con id: ${req.params.id}` });
});

export default router;
