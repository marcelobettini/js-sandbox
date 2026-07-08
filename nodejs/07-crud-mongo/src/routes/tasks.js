import { Router } from 'express';
import { findAll, findById, insertTask, updateTask, deleteTask } from '../db/tasksCollection.js';

const router = Router();
const VALID_PRIORITIES = ['low', 'mid', 'high'];

router.get("/", async (req, res) => {
    const tasks = await findAll();
    res.json(tasks);
});

router.get("/:id", async (req, res, next) => {
    const task = await findById(req.params.id);
    if (!task) {
        const err = new Error(`Tarea con id ${req.params.id} no encontrada`);
        err.status = 404;
        return next(err);
    }
    res.json(task);
});

router.post("/", async (req, res, next) => {
    const { title, description = "", priority = "low" } = req.body;

    if (!title) {
        const err = new Error('El campo title es requerido');
        err.status = 400;
        return next(err);
    }
    if (!VALID_PRIORITIES.includes(priority)) {
        const err = new Error(`priority debe ser uno de: ${VALID_PRIORITIES.join(', ')}`);
        err.status = 400;
        return next(err);
    }

    // SEGUNDA ETAPA — validación de tipos: express.json() acepta cualquier valor JSON válido,
    // por lo que title podría ser un número, objeto o array. No causa injection con el driver
    // nativo, pero sí guarda datos con forma incorrecta. Solución: typeof title !== 'string'.

    const now = new Date();
    const task = await insertTask({ title, description, priority, completed: false, createdAt: now, updatedAt: now });
    res.status(201).json(task);
});

router.patch("/:id", async (req, res, next) => {
    // Whitelist explícita: evita que el cliente sobreescriba _id, completed, createdAt, etc.
    const allowed = ['title', 'description', 'priority'];
    const fields = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));

    if (fields.priority && !VALID_PRIORITIES.includes(fields.priority)) {
        const err = new Error(`priority debe ser uno de: ${VALID_PRIORITIES.join(', ')}`);
        err.status = 400;
        return next(err);
    }

    fields.updatedAt = new Date();
    const task = await updateTask(req.params.id, fields);
    if (!task) {
        const err = new Error(`Tarea con id ${req.params.id} no encontrada`);
        err.status = 404;
        return next(err);
    }
    res.json(task);
});

router.patch("/:id/toggle", async (req, res, next) => {
    const current = await findById(req.params.id);
    if (!current) {
        const err = new Error(`Tarea con id ${req.params.id} no encontrada`);
        err.status = 404;
        return next(err);
    }

    // SEGUNDA ETAPA — race condition: este toggle hace dos operaciones separadas (read + write).
    // Si dos requests llegan al mismo documento simultáneamente, ambos leerían el mismo valor
    // y lo setearían al mismo resultado en vez de alternarlo correctamente.
    // Solución: un aggregation pipeline en findOneAndUpdate invierte el booleano en el servidor
    // en una sola operación atómica, sin necesidad de leer el documento primero.
    const task = await updateTask(req.params.id, { completed: !current.completed, updatedAt: new Date() });
    res.json(task);
});

router.delete("/:id", async (req, res, next) => {
    const task = await deleteTask(req.params.id);
    if (!task) {
        const err = new Error(`Tarea con id ${req.params.id} no encontrada`);
        err.status = 404;
        return next(err);
    }
    res.status(200).json({ message: 'Tarea eliminada exitosamente', task });
});

export default router;
