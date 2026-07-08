import { instrucciones } from "../instructions/prompt.js";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, });

/**
 * @typedef {import('../database/database.js').ChatHistoryEntry} ChatHistoryEntry
 */

/**
 * Convierte el historial recuperado de la base de datos y la pregunta actual en el
 * array de turnos que espera `contents` de la API de Gemini, alternando roles
 * 'user' / 'model' en orden cronológico y agregando la pregunta actual al final.
 *
 * @param {ChatHistoryEntry[]} history - Turnos previos de la conversación, ordenados cronológicamente.
 * @param {string} prompt - Pregunta actual del usuario.
 * @returns {Array<{role: 'user'|'model', parts: {text: string}[]}>} Turnos listos para enviar como `contents`.
 */
function buildContents(history, prompt) {
    const turns = [];

    for (const { userQuestion, chatResponse } of history) {
        turns.push({ role: "user", parts: [{ text: userQuestion }] });
        turns.push({ role: "model", parts: [{ text: chatResponse }] });
    }

    turns.push({ role: "user", parts: [{ text: prompt }] });

    return turns;
}

/**
 * Genera una respuesta de Gemini para la pregunta actual, incluyendo el historial
 * de la conversación (si existe) como turnos previos nativos (role user/model).
 *
 * @param {string} prompt - Pregunta actual del usuario (ya trimeada).
 * @param {ChatHistoryEntry[]} [history=[]] - Turnos previos de la conversación. Vacío para una conversación nueva.
 * @returns {Promise<{status: number, data: {text: string}|null}>} Resultado normalizado: 200 y el texto de la
 *   respuesta en éxito, o el status de error (default 500) y data null en caso de fallo.
 */
export async function generateContentFromGemini(prompt, history = []) {
    try {

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash", // Otros modelos: gemini-3.0-flash // gemini-3.1-flash-lite
            contents: buildContents(history, prompt),
            config: {
                systemInstruction: instrucciones,
            }
        });

        if (!response.text) {
            throw new Error("Gemini API returned response without text property");
        }

        return {
            status: 200,
            data: {
                text: response.text,
            },
        };

    } catch (error) {
        console.error("Gemini API error:", error);

        return {
            status: error?.status || 500,
            data: null,
        };
    }
}
