// Capa de acceso a datos para la colección users.

import { getDb } from './mongoClient.js';

const COLLECTION = 'users';

// Crea el índice único sobre email una sola vez al arrancar.
// Si ya existe, MongoDB lo ignora sin error.
export async function ensureIndexes() {
  await getDb().collection(COLLECTION).createIndex({ email: 1 }, { unique: true });
}

// Devuelve el documento completo (incluye password hash) para que auth.js
// pueda ejecutar bcrypt.compare. El router es responsable de NO exponer
// el hash al cliente.
export async function findByEmail(email) {
  return getDb().collection(COLLECTION).findOne({ email });
}

// Inserta un usuario nuevo. El objeto ya trae id en lugar de _id,
// igual que en mongoStore.js — hay que renombrarlo antes de insertar.
export async function create(user) {
  const { id, ...rest } = user;
  await getDb().collection(COLLECTION).insertOne({ _id: id, ...rest });
}
