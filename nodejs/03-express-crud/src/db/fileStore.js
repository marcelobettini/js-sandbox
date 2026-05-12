// Módulo de persistencia: maneja la lectura y escritura del archivo JSON.
// Mantiene una copia en memoria (tasks) que se sincroniza con el archivo
// después de cada operación de escritura.

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// En ESM no existe __dirname; se reconstruye a partir de import.meta.url
// ─── ¿Qué es __dirname y por qué hay que "crearlo" en ES Modules? ────────────
//
// __dirname es una cadena con la ruta absoluta del directorio que contiene el
// archivo que se está ejecutando. Sirve para construir rutas de archivos de
// forma portátil, sin importar desde dónde se invoca el proceso de Node.
//
// EN COMMONJS no hace falta crearlo: Node.js envuelve automáticamente cada
// archivo .js en una función antes de ejecutarlo, la llamada "module wrapper":
//
//   (function(exports, require, module, __filename, __dirname) {
//     // tu código va aquí
//   });
//
// Esa función recibe __dirname (y __filename) como parámetros, por eso están
// disponibles como si fueran variables globales en cualquier archivo .cjs.
// En realidad son locales a cada módulo, inyectadas por el runtime.
//
// EN ES MODULES ese wrapper ya no existe. El estándar ES Modules fue diseñado
// para ser independiente del entorno (browser, Node, Deno, workers…), y
// conceptos como "la ruta del archivo en disco" son específicos del sistema
// operativo: no tienen sentido en un browser. Por eso el comité TC39 decidió
// no incluirlos en la especificación del lenguaje.
//
// Lo que sí provee ESM es import.meta.url: una URL con el path del archivo
// actual (ej: "file:///home/user/proyecto/src/index.js"). A partir de ella

// podemos reconstruir __dirname con dos pasos:
//
//   1. fileURLToPath(import.meta.url)  →  convierte la URL a ruta del SO
//                                         ("/home/user/proyecto/src/index.js")
//   2. dirname(...)                    →  extrae solo el directorio
//                                         ("/home/user/proyecto/src")
//
// ¿Por qué se removió si seguimos necesitándolo?
// La respuesta corta es que ESM prioriza la portabilidad entre entornos sobre
// la comodidad de Node. El trade-off fue intencional: un módulo ES "puro" no
// asume que corre en un sistema de archivos. Node.js luego cubrió el caso de
// uso exponiendo import.meta.url y las utilidades de conversión, pero dejó la
// reconstrucción a cargo del desarrollador para dejar explícito que se está
// accediendo a una capacidad específica del entorno, no del lenguaje.
// ─────────────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const FILE_PATH = join(__dirname, '../data/tasks.json');

// Copia en memoria del archivo JSON
let tasks = [];

// Lee el archivo y carga los datos en memoria
function load() {
  try {
    const raw = readFileSync(FILE_PATH, 'utf-8');
    tasks = JSON.parse(raw);
  } catch (err) {
    // ENOENT = el archivo no existe todavía → es el caso esperado en el primer arranque.
    // Cualquier otro error (JSON malformado, permisos, disco lleno) indica un problema
    // real: no destruimos el archivo sobreescribiéndolo con [], sino que propagamos.
    if (err.code !== 'ENOENT') throw err;
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

// Devuelve una copia superficial de las tareas en memoria.
// Se devuelve copia (spread) y no la referencia directa para evitar que el caller
// pueda mutar el array interno sin pasar por persist(), rompiendo la sincronización.
function getAll() {
  return [...tasks];
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
  /*
  Qué hace la línea anterior, paso a paso:
  1. tasks[index] → obtiene la tarea original a actualizar
  2. { ...tasks[index] } → crea una copia superficial de la tarea original
  3. { ...tasks[index], ...fields } → mezcla la copia con los nuevos campos, sobrescribiendo los existentes
  4. tasks[index] = ... → asigna la tarea actualizada de vuelta al array en memoria

  Esto asegura que solo se actualicen los campos especificados en "fields", sin perder los demás.
  */

  // Capturamos la tarea antes de llamar a persist(), porque persist() invoca load(),
  // que reasigna tasks desde el archivo. Después de eso, el índice sigue siendo válido
  // (load no reordena), pero hacer tasks.find() sería un traversal extra innecesario.
  const updated = tasks[index];
  persist();

  return updated;
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
