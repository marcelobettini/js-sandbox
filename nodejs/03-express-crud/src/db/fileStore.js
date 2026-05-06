// Módulo de persistencia: maneja la lectura y escritura del archivo JSON.
// Mantiene una copia en memoria (tasks) que se sincroniza con el archivo
// después de cada operación de escritura.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// En ESM no existe __dirname; se reconstruye a partir de import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_PATH = join(__dirname, '../data/tasks.json');

// Copia en memoria del archivo JSON
let tasks = [];

// Lee el archivo y carga los datos en memoria
function load() {
  try {
    const raw = readFileSync(FILE_PATH, 'utf-8');
    tasks = JSON.parse(raw);
  } catch {
    // Si el archivo no existe o está vacío, iniciamos con array vacío
    tasks = [];
    save();
  }
}

// Escribe el estado actual de memoria al archivo JSON
function save() {
  writeFileSync(FILE_PATH, JSON.stringify(tasks, null, 2), 'utf-8');
}

// Escribe y recarga: garantiza que memoria y archivo estén sincronizados
function persist() {
  save();
  load();
}

// Devuelve todas las tareas en memoria
function getAll() {
  return tasks;
}

// Devuelve una tarea por id, o null si no existe
function getById(id) {
  return tasks.find((t) => t.id === id) || null;
}

// Agrega una tarea nueva y persiste
function add(task) {
  tasks.push(task);
  persist();
}

// Actualiza los campos de una tarea por id y persiste.
// Devuelve la tarea actualizada, o null si no se encuentra.
function update(id, fields) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  tasks[index] = { ...tasks[index], ...fields };
  persist();

  return tasks.find((t) => t.id === id);
}

// Elimina una tarea por id y persiste.
// Devuelve true si se eliminó, false si no se encontró.
function remove(id) {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;

  tasks.splice(index, 1);
  persist();

  return true;
}

// Carga inicial al importar el módulo
load();

export { getAll, getById, add, update, remove };
