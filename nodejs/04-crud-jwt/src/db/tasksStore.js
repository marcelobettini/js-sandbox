// Capa de acceso a datos para la colección tasks.

import { getDb } from './mongoClient.js';

const COLLECTION = 'tasks';

// Convierte un documento MongoDB al shape que espera el router:
//   { _id: uuid, ...campos }  →  { id: uuid, ...campos }
// MongoDB usa _id como PK; fuera del store solo existe "id".
function toTask(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: _id, ...rest };
}

// Devuelve todas las tareas. Acepta filtros opcionales que se traducen
// a una query de MongoDB — el filtrado ocurre en el servidor, no en memoria.
export async function getAll({ completed, search } = {}) {
  const query = {};

  if (completed !== undefined) {
    // req.query llega como string; convertimos al booleano que MongoDB espera
    query.completed = completed === 'true';
  }

  if (search) {
    //* Escapar caracteres especiales antes de construir el RegExp para evitar ReDoS: escaped sirve para neutralizar cualquier metacaracter que el usuario haya incluido en la búsqueda, tratándolo como texto literal. La primera parte de la expresión regular /[.*+?^${}()|[\]\\]/g busca cualquier carácter que tenga un significado especial en las expresiones regulares (como ., *, +, ?, etc.). La función replace los reemplaza por su versión escapada (precedida por una barra invertida \), lo que asegura que se traten como caracteres literales en lugar de operadores de regex. Esto es crucial para prevenir ataques de ReDoS, donde un atacante podría intentar explotar patrones de regex mal diseñados para causar un consumo excesivo de recursos.

    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  const docs = await getDb().collection(COLLECTION).find(query).toArray();
  return docs.map(toTask);
}

// Devuelve una tarea por id, o null si no existe.
export async function getById(id) {
  const doc = await getDb().collection(COLLECTION).findOne({ _id: id });
  return toTask(doc);
}

// Inserta una tarea nueva.
// El router construye el task con campo "id"; hay que renombrarlo a "_id"
// antes de insertar para que sea la clave primaria de MongoDB.
export async function add(task) {
  const { id, ...rest } = task;
  await getDb().collection(COLLECTION).insertOne({ _id: id, ...rest });
}

// Actualiza los campos indicados y devuelve la tarea ya actualizada,
// o null si no se encontró el id.
// returnDocument: 'after' hace que MongoDB devuelva el doc con los cambios aplicados.
// En el driver v5+ findOneAndUpdate devuelve el doc directamente (sin .value).
export async function update(id, fields) {
  const doc = await getDb().collection(COLLECTION).findOneAndUpdate(
    { _id: id },
    { $set: fields },
    { returnDocument: 'after' }
  );
  return toTask(doc);
}

// Elimina una tarea por id.
// Devuelve true si se eliminó, false si no se encontró.
export async function remove(id) {
  const result = await getDb().collection(COLLECTION).deleteOne({ _id: id });
  return result.deletedCount === 1;
}
