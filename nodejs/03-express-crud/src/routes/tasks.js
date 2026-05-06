// Router de tareas: define todos los endpoints del CRUD.
// Usa query params para filtrar: ?completed=true|false y ?search=keyword

import { Router } from 'express';
import { randomUUID } from 'crypto';
import * as store from '../db/fileStore.js';

const router = Router();

const VALID_PRIORITIES = ['low', 'mid', 'high'];

// GET /tasks
// Sin query params: devuelve todas las tareas.
// ?completed=true|false → filtra por estado de completitud.
// ?search=keyword       → busca por palabra clave en título o descripción.
router.get('/', (req, res) => {
  let result = store.getAll();

  const { completed, search } = req.query;

  // Filtro por estado
  if (completed !== undefined) {
    const flag = completed === 'true';
    result = result.filter((t) => t.completed === flag);
  }

  // Filtro por búsqueda (case-insensitive)
  if (search) {
    const keyword = search.toLowerCase();
    result = result.filter(
      (t) =>
        t.title.toLowerCase().includes(keyword) ||
        t.description.toLowerCase().includes(keyword)
    );
  }

  res.json(result);
});

// GET /tasks/:id → devuelve una tarea por su id
router.get('/:id', (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// POST /tasks → crea una nueva tarea
router.post('/', (req, res) => {
  const { title, description, priority } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'title and description are required' });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'priority must be low, mid, or high' });
  }

  const now = new Date().toISOString();
  const task = {
    id: randomUUID(),
    title,
    description,
    priority: priority ?? 'mid',
    completed: false,
    createdAt: now,
    updatedAt: now,
  };

  store.add(task);
  res.status(201).json(task);
});

// PATCH /tasks/:id → actualización parcial de una tarea
router.patch('/:id', (req, res) => {
  const task = store.getById(req.params.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  const { title, description, priority, completed } = req.body;

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({ error: 'priority must be low, mid, or high' });
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be a boolean' });
  }

  // Construye el objeto solo con los campos que vienen en el body.
  const updates = { updatedAt: new Date().toISOString() };

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (priority !== undefined) updates.priority = priority;
  if (completed !== undefined) updates.completed = completed;

  // Versión compacta equivalente usando spread + short-circuit:
  // ...(condición && { prop }) → spread de false no agrega nada; spread de { prop } sí.
  // const updates = {
  //   ...(title !== undefined && { title }),
  //   ...(description !== undefined && { description }),
  //   ...(priority !== undefined && { priority }),
  //   ...(completed !== undefined && { completed }),
  //   updatedAt: new Date().toISOString(),
  // };

  const updated = store.update(req.params.id, updates);
  res.json(updated);
});

// DELETE /tasks/:id → elimina una tarea
router.delete('/:id', (req, res) => {
  const deleted = store.remove(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Task not found' });
  }
  // 204 No Content: éxito sin cuerpo de respuesta
  res.status(204).send();
});

export default router;
