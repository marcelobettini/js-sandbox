// Capa de acceso a datos sobre MongoDB Atlas.
// Todas las operaciones son async y trabajan sobre la colección "tasks".

import { getDb } from './mongoClient.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'tasks';

// Devuelve todas las tareas. Acepta filtros opcionales que se traducen
// a una query de MongoDB — el filtrado ocurre en el servidor, no en memoria.
export async function getAll({ completed, search } = {}) {
  const query = {};

  if (completed !== undefined) {
    // req.query llega como string; convertimos al booleano que MongoDB espera
    query.completed = completed === 'true';
  }

  if (search) {
    // Escapar caracteres especiales antes de construir el RegExp para evitar ReDoS:
    // trata el input del usuario como texto literal, no como patrón.
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    query.$or = [{ title: regex }, { description: regex }];
  }

  return getDb().collection(COLLECTION).find(query).toArray();
}

// Devuelve una tarea por id, o null si no existe o el id no tiene formato válido.
export async function getById(id) {
  if (!ObjectId.isValid(id)) return null;
  return getDb().collection(COLLECTION).findOne({ _id: new ObjectId(id) });
}

// Inserta una tarea nueva y devuelve el documento con el _id generado por MongoDB.
export async function add(task) {
  const result = await getDb().collection(COLLECTION).insertOne(task);
  return { _id: result.insertedId, ...task };
}

// Actualiza los campos indicados y devuelve la tarea ya actualizada,
// o null si no se encontró el id.
// returnDocument: 'after' hace que MongoDB devuelva el doc con los cambios aplicados.
// En el driver v5+ findOneAndUpdate devuelve el doc directamente (sin .value).
export async function update(id, fields) {
  if (!ObjectId.isValid(id)) return null;
  return getDb().collection(COLLECTION).findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: fields },
    { returnDocument: 'after' }
  );
}

// Elimina una tarea por id.
// Devuelve true si se eliminó, false si no se encontró.
export async function remove(id) {
  if (!ObjectId.isValid(id)) return false;
  const result = await getDb().collection(COLLECTION).deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount === 1;
}
