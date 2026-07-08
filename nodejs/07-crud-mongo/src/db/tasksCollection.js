import { ObjectId } from 'mongodb';
import { getDb } from './client.js';
/*
const tasks = getDb().collection('tasks');  -> se ejecuta AHORA, al importar el módulo
const col = () => getDb().collection('tasks');  -> se ejecuta DESPUÉS, cada vez que llamas col()

El problema con la versión directa es que getDb() lanza un error si se llama antes de que connectToDatabase() haya terminado. Como el módulo se importa al arrancar el proceso — antes de conectar a Mongo — tasks sería undefined (o explotaría).

Con la función col(), getDb() no se llama hasta que un route handler la invoca, momento en que la conexión ya existe.
*/
const col = () => getDb().collection('tasks');

// find() devuelve un cursor (stream lazy). toArray() lo materializa en memoria de una vez.
// SEGUNDA ETAPA — paginación: para colecciones grandes esto carga todos los documentos en RAM.
// Solución: aceptar parámetros limit/skip en la ruta y aplicarlos al cursor:
//   col().find().skip(offset).limit(pageSize).toArray()
export function findAll() {
    return col().find().toArray();
}

// MongoDB almacena _id como tipo binario ObjectId (12 bytes), no como string.
// El param :id llega de Express como string; sin la conversión, la comparación de tipos
// falla silenciosamente y findOne siempre retorna null aunque el documento exista.
// findOne retorna el documento o null si no existe.
// SEGUNDA ETAPA — ObjectId inválido: si :id no tiene el formato correcto (hex de 24 chars),
// new ObjectId(id) lanza un BSONError interno que llega al error handler sin status → 500.
// Solución: wrapear con try/catch y asignar err.status = 400 antes de relanzar.
export function findById(id) {
    return col().findOne({ _id: new ObjectId(id) });
}

// insertOne agrega el documento y retorna metadata (insertedId, acknowledged),
// no el documento completo. Se combina insertedId + data para devolverlo entero.
export async function insertTask(data) {
    const result = await col().insertOne(data);
    return { _id: result.insertedId, ...data };
}

// findOneAndUpdate hace búsqueda y actualización en una sola operación atómica del servidor.
// $set modifica solo los campos indicados sin sobrescribir el resto del documento
// (replaceOne, en cambio, reemplaza el documento entero).
// returnDocument: 'after' retorna el documento ya modificado, no el estado anterior.
export function updateTask(id, fields) {
    return col().findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: fields },
        { returnDocument: 'after' }
    );
}

// findOneAndDelete elimina el documento y lo retorna en una sola operación atómica.
// Retorna el documento tal como estaba antes de eliminarse.
// deleteOne solo confirmaría si algo fue eliminado, sin devolver el documento.
export function deleteTask(id) {
    return col().findOneAndDelete({ _id: new ObjectId(id) });
}
