import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_CS) {
    throw new Error("Environment variable MONGODB_CS is not defined. Check your .env file.");
}

const client = new MongoClient(process.env.MONGODB_CS)

/**
 * @typedef {Object} ChatHistoryEntry
 * @property {number} date - Timestamp (ms) del turno.
 * @property {string} userQuestion - Pregunta del usuario en ese turno.
 * @property {string} chatResponse - Respuesta del asistente en ese turno.
 */

/**
 * @typedef {Object} ChatRecord
 * @property {string} chatId - Identificador de la conversación.
 * @property {number} datetime - Timestamp (ms) del turno.
 * @property {string} userQuestion - Pregunta del usuario.
 * @property {string} chatResponse - Respuesta del asistente.
 */

/**
 * Abre (o reutiliza) la conexión a MongoDB y verifica que esté activa con un ping.
 *
 * @returns {Promise<'ok'>} 'ok' si la conexión y el ping fueron exitosos.
 * @throws {Error} Si no se pudo conectar o el ping falló.
 */
export async function connectDB() {
    try {
        await client.connect()                              // Intentamos la conexión
        await client.db("AIChat").command({ ping: 1 })      // Enviamos un 'ping' para confirmar que está activo
        console.log("✅ Conexión exitosa a MongoDB")
        return 'ok'
    } catch (error) {
        console.error("❌ Error al conectar a MongoDB:", error)
        throw error // Propagamos el error para manejarlo en la app principal
    }
}

/**
 * Persiste un turno de conversación en la colección 'History'.
 *
 * @param {ChatRecord} chatHistory - Turno de conversación a guardar.
 * @returns {Promise<'ok'|undefined>} 'ok' si la inserción fue confirmada, undefined en caso contrario.
 * @throws {Error} Si la operación contra MongoDB falla.
 */
export async function saveChat(chatHistory) {
    console.table(chatHistory)

    try {
        const db = client.db("AIChat")
        const collection = db.collection('History')
        const result = await collection.insertOne(chatHistory)

        if (!result.acknowledged) {
            throw new Error("MongoDB insertion was not acknowledged");
        }

        console.log("📝 Historial guardado con ID:", result.insertedId)
        return 'ok'

    } catch (error) {
        console.error("❌ Error al guardar en History:", error)
        throw error
    }
}

/**
 * Recupera el historial de una conversación, ordenado cronológicamente.
 * Se usa para reconstruir los turnos previos que se le pasan a Gemini
 * cuando el cliente continúa una conversación existente (envía chatId).
 *
 * @param {string} elToken - chatId de la conversación a recuperar.
 * @returns {Promise<ChatHistoryEntry[]>} Turnos previos de la conversación (array vacío si no hay historial).
 * @throws {Error} Si la consulta a MongoDB falla.
 */
export async function getChatHistory(elToken) {
    try {     // Buscamos x chatId ordenado x datetime
        const db = client.db("AIChat")
        const collection = db.collection('History')
        const history = await collection
            .find({ chatId: elToken })
            .sort({ datetime: 1 })
            .toArray()

        if (history.length > 0) {   // Mapeamos objeto para retornar solo fechas, preguntas y respuestas
            const chatHistory = history.map((h)=> {
                                    return {
                                        date: h.datetime,
                                        userQuestion: h.userQuestion,
                                        chatResponse: h.chatResponse
                                    }
                                })
            return chatHistory
        }
        return []

    } catch (error) {
        console.error("❌ Error al obtener el historial:", error)
        throw error
    }
}
