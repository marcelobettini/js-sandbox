// Router de tareas: define todos los endpoints del CRUD.

import { Router } from 'express';
import { randomUUID } from 'crypto';
import { getAll, getById, add, update, remove } from '../db/mongoStore.js';

const router = Router();

// Valores válidos para el campo priority
const VALID_PRIORITIES = ['low', 'mid', 'high'];

// ─── GET /api/v1/tasks ────────────────────────────────────────────────────────
// Lista todas las tareas. Acepta dos query params opcionales que se pueden
// combinar entre sí:
//   ?completed=true|false  →  filtra por estado de completitud
//   ?search=keyword        →  busca la keyword en título o descripción (case-insensitive)
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

// ─── PATCH /api/v1/tasks/:id/toggle ──────────────────────────────────────────
// Invierte el campo completed sin requerir body.
// IMPORTANTE: debe declararse antes de PATCH /:id porque Express evalúa rutas
// en orden de declaración y /:id capturaría '/uuid/toggle' si va primero.
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const task = await getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const updated = await update(req.params.id, {
      completed: !task.completed,
      updatedAt: new Date().toISOString(),
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── GET /api/v1/tasks/:id ────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const task = await getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/tasks ───────────────────────────────────────────────────────
// Crea una tarea nueva. Campos requeridos: title.
// Campos opcionales con defaults: description (''), priority ('low'), completed (false).
router.post('/', async (req, res, next) => {
  try {
    const { title, description = '', priority = 'low' } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'title is required' });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res
        .status(400)
        .json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const now = new Date().toISOString();
    const task = {
      id: randomUUID(),
      title,
      description,
      priority,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await add(task);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /api/v1/tasks/:id ──────────────────────────────────────────────────
// Actualización parcial: solo se modifican los campos presentes en el body.
// id, createdAt no son actualizables. updatedAt se renueva automáticamente.
router.patch('/:id', async (req, res, next) => {
  try {
    const task = await getById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const { title, description, priority, completed } = req.body;

    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
      return res
        .status(400)
        .json({ error: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    // Construimos el objeto de cambios con solo los campos provistos
    const fields = { updatedAt: new Date().toISOString() };
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (priority !== undefined) fields.priority = priority;
    if (completed !== undefined) fields.completed = completed;

    const updated = await update(req.params.id, fields);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /api/v1/tasks/:id ─────────────────────────────────────────────────
// 204 No Content es la respuesta estándar REST para un DELETE exitoso:
// la operación fue exitosa y no hay cuerpo que devolver.
router.delete('/:id', async (req, res, next) => {
  try {
    const removed = await remove(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
