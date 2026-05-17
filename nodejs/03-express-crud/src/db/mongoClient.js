// Módulo de conexión a MongoDB Atlas.
// Implementa el patrón singleton: una sola instancia de MongoClient
// compartida por toda la aplicación.

import { MongoClient } from 'mongodb';

const DB_NAME = 'todoAPI';

// Referencia a la DB activa; se asigna en connectDB()
let db;

// Crea el cliente, abre la conexión y guarda la referencia a la DB.
// Debe llamarse una sola vez al arrancar el servidor, antes de app.listen().
export async function connectDB() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log(`Conectado a MongoDB Atlas — base de datos: ${DB_NAME}`);
}

// Devuelve la instancia de DB activa.
// Lanza si se llama antes de connectDB() — fallo rápido y explícito.
export function getDb() {
  if (!db) throw new Error('DB no inicializada. Llamá a connectDB() primero.');
  return db;
}
