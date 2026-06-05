import { Router } from 'express';
const router = Router();
import { getAllTasks, getById, add, update, remove } from '../services/fileStore.js';

// Valores válidos para el campo priority
const VALID_PRIORITIES = ['low', 'mid', 'high'];

// GET /api/v1/tasks
// Devuelve todas las tareas. Si no hay ninguna, responde 404.
router.get("/", (req, res, next) => {
    const tareas = getAllTasks();
    if (tareas.length === 0) {
        const error = new Error("No se encontraron tareas");
        error.status = 404;
        return next(error); // pasa el error al middleware de manejo de errores en index.js
    }
    res.json(tareas);
});

// GET /api/v1/tasks/:id
// Devuelve una tarea específica por su id.
router.get("/:id", (req, res, next) => {
    // req.params contiene los segmentos dinámicos de la URL (lo que está después de ":")
    const { id } = req.params;
    try {
        const tarea = getById(id);
        if (!tarea) {
            const error = new Error("Tarea no encontrada");
            error.status = 404;
            return next(error);
        }
        res.json(tarea);
    } catch (error) {
        return next(error);
    }
});

// POST /api/v1/tasks
// Crea una nueva tarea. El id, completed, createdAt y updatedAt los genera el servidor.
router.post("/", (req, res, next) => {
    // Desestructuramos el body con valores por defecto para los campos opcionales
    const { title, description = "", priority = "low" } = req.body;

    // Validación: title es obligatorio
    if (!title) {
        const error = new Error("El campo 'title' es obligatorio");
        error.status = 400; // 400 Bad Request = el cliente mandó datos inválidos
        return next(error);
    }

    // Validación: priority solo puede ser uno de los valores del array
    if (!VALID_PRIORITIES.includes(priority)) {
        const error = new Error("El campo porioridad debe contener 'mid' | 'low' | 'high' ");
        error.status = 400;
        return next(error);
    }

    const now = new Date();
    const task = {
        id: crypto.randomUUID(), // genera un id único, disponible de forma nativa en Node.js
        title,
        description,
        priority,
        completed: false,       // siempre empieza en false, el cliente no puede elegir
        createdAt: now,
        updatedAt: now
    };

    add(task);
    res.status(201).json(task); // 201 Created = se creó un nuevo recurso exitosamente
});

// PUT /api/v1/tasks/:id
// Reemplaza TODA la tarea con los datos que lleguen en el body.
// Semántica REST: PUT es "reemplazo total", por eso todos los campos tienen que venir
// y completed se resetea a false (el cliente no puede enviarlo).
router.put("/:id", (req, res, next) => {
    const { id } = req.params;
    const { title, description = "", priority = "low" } = req.body;

    if (!title) {
        const error = new Error("El campo 'title' es obligatorio");
        error.status = 400;
        return next(error);
    }
    if (!VALID_PRIORITIES.includes(priority)) {
        const error = new Error("El campo prioridad debe contener 'low' | 'mid' | 'high'");
        error.status = 400;
        return next(error);
    }

    // update() devuelve null si no encontró la tarea con ese id
    const updated = update(id, { title, description, priority, completed: false });
    if (!updated) {
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
    }

    res.json(updated);
});

// PATCH /api/v1/tasks/:id
// Actualiza SOLO los campos que lleguen en el body, sin tocar el resto.
// Ejemplo de uso: marcar una tarea como completada enviando solo { "completed": true }
router.patch("/:id", (req, res, next) => {
    const { id } = req.params;

    // Desestructuramos sin valores por defecto: si el cliente no manda un campo, queda undefined
    const { title, description, priority, completed } = req.body;

    // Solo validamos priority si el cliente la envió (no queremos rechazar un patch que no la incluye)
    if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
        const error = new Error("El campo prioridad debe contener 'low' | 'mid' | 'high'");
        error.status = 400;
        return next(error);
    }

    // Armamos un objeto solo con los campos que realmente llegaron en el body
    // Si metiéramos campos undefined en el merge, pisaríamos los valores existentes con undefined
    const fields = {};
    if (title !== undefined) fields.title = title;
    if (description !== undefined) fields.description = description;
    if (priority !== undefined) fields.priority = priority;
    if (completed !== undefined) fields.completed = completed;

    const updated = update(id, fields);
    if (!updated) {
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
    }

    res.json(updated);
});

// DELETE /api/v1/tasks/:id
// Elimina la tarea con el id indicado.
router.delete("/:id", (req, res, next) => {
    const { id } = req.params;
    const deleted = remove(id);
    if (!deleted) {
        const error = new Error("Tarea no encontrada");
        error.status = 404;
        return next(error);
    }
    // 204 No Content = operación exitosa, pero no hay nada que devolver
    res.status(204).send();
});

export default router;
