// Este módulo es la "capa de datos" de la aplicación.
// Su responsabilidad es leer y escribir tareas en un archivo JSON,
// y mantener una copia en memoria para no tener que leer el archivo en cada request.

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// En ESM no existe __dirname como en CommonJS, así que lo reconstruimos:
// import.meta.url es la URL del archivo actual → fileURLToPath lo convierte en ruta → dirname obtiene su carpeta
const __dirname = dirname(fileURLToPath(import.meta.url));

// Armamos la ruta absoluta al archivo donde se guardan las tareas
const FILE_PATH = join(__dirname, '../data/tasks.json');

// Estado en memoria: al arrancar el servidor se carga desde el archivo,
// y cada vez que se modifica algo se vuelve a escribir al archivo.
let tasks = [];

// Lee el archivo JSON y carga su contenido en el array `tasks`.
// Se llama una sola vez al importar este módulo (ver al final del archivo).
function loadTasks() {
    try {
        const jsonData = readFileSync(FILE_PATH, 'utf-8');
        tasks = JSON.parse(jsonData);
    } catch (err) {
        // ENOENT = "Error NO ENTry" → el archivo todavía no existe (primera vez que corre la app)
        // En ese caso creamos el archivo con un array vacío y no lanzamos error
        if (err.code !== 'ENOENT') {
            const error = new Error("Error al cargar tareas: " + err.message);
            error.status = 500;
            return next(error);
        }
        save();
    }
}

// Escribe el array `tasks` completo al archivo JSON.
// JSON.stringify(tasks, null, 2) → el "2" agrega indentación para que sea legible
function save() {
    writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Agrega una nueva tarea al array y persiste el cambio en el archivo
function add(newTask) {
    tasks.push(newTask);
    save();
}

// Devuelve una copia del array (con spread) para que quien la reciba
// no pueda modificar el array interno por accidente
function getAllTasks() {
    return [...tasks];
}

// Busca una tarea por su id. Devuelve la tarea o undefined si no existe.
function getById(id) {
    return tasks.find(task => task.id === id);
}

// Reemplaza los campos de una tarea existente con los datos recibidos.
// Usa spread operator para hacer merge: primero los campos viejos, luego los nuevos.
// El id y updatedAt se fuerzan para que no puedan ser pisados desde afuera.
// Devuelve la tarea actualizada, o null si no se encontró el id.
function update(id, data) {
    const index = tasks.findIndex(task => task.id === id);

    // findIndex devuelve -1 si no encuentra ningún elemento
    if (index === -1) return null;

    tasks[index] = { ...tasks[index], ...data, id, updatedAt: new Date() };
    save();
    return tasks[index];
}

// Elimina la tarea con ese id del array.
// splice(index, 1) → elimina 1 elemento en la posición indicada, modificando el array original.
// Devuelve true si la eliminó, false si no existía.
function remove(id) {
    const index = tasks.findIndex(task => task.id === id);
    if (index === -1) return false;
    tasks.splice(index, 1);
    save();
    return true;
}

// Ejecutamos loadTasks() inmediatamente al importar este módulo,
// así las tareas ya están en memoria antes del primer request
loadTasks();

export { getAllTasks, getById, add, update, remove };
