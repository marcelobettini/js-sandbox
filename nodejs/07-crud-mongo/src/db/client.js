import { MongoClient } from 'mongodb';

// Un solo MongoClient por proceso: internamente gestiona un pool de conexiones TCP
// reutilizadas entre requests. Nunca crear uno por request.
const client = new MongoClient(process.env.MONGODB_URI);
let db;

export async function connectToDatabase() {
    await client.connect();
    // Sin argumento usa el nombre de DB del URI (ej: /crud-mongo).
    db = client.db();
    console.log('Conectado a MongoDB');
}

// SEGUNDA ETAPA — idempotencia:
//
// Una operación es idempotente cuando ejecutarla N veces produce el mismo resultado
// que ejecutarla una sola vez. El resultado final del sistema es idéntico sin importar
// cuántas veces se repita.
//
// Ejemplos:
//   - Idempotente:     SET precio = 100      → siempre queda en 100
//   - NO idempotente:  SET precio = precio + 1 → cada llamada cambia el resultado
//   - Idempotente:     HTTP PUT /tareas/1 { title: "foo" } → siempre pisa el mismo valor
//   - NO idempotente:  HTTP POST /tareas { title: "foo" }  → crea un documento nuevo cada vez
//   - Idempotente:     createIndexes() de MongoDB → si el índice existe, no hace nada
//   - Idempotente:     DELETE /tareas/1 → la tarea deja de existir, repetirlo no cambia eso
//
// En este caso, connectToDatabase() sin guard NO es idempotente: llamarla dos veces
// (hot-reload con --watch, tests, error de inicialización) intenta conectar un cliente
// ya conectado y el driver lanza un error.
// Solución: agregar `if (db) return;` al inicio convierte la función en idempotente.

// SEGUNDA ETAPA — índices: sin índices, cada consulta hace un full collection scan
// (recorre todos los documentos). Para este proyecto convendrían:
//   { createdAt: -1 }              → listado ordenado por fecha
//   { completed: 1, createdAt: -1 } → filtrar por estado + ordenar
// Se crean con db.collection('tasks').createIndexes([...]) luego de conectar.
// createIndexes() es idempotente: si ya existen, no hace nada.

// SEGUNDA ETAPA — cierre limpio: cuando el proceso se apaga (deploy, Ctrl+C del servidor),
// las conexiones abiertas se cortan abruptamente. En producción conviene escuchar SIGTERM:
//   process.on('SIGTERM', async () => { await client.close(); process.exit(0); });
// Esto le da tiempo a MongoDB de cerrar el socket limpiamente.

export function getDb() {
    return db;
}
