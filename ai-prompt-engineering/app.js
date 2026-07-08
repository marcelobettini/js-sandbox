// IMPORTS
import express from "express";
import crypto from "node:crypto";

import { generateContentFromGemini } from "./services/geminiService.js";
import { connectDB, saveChat, getChatHistory } from "./database/database.js";

// VARIABLES Y CONSTANTES
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE
app.use(express.json());

// API
/**
 * POST /ask-questions
 *
 * Body: `{ prompt: string, chatId?: string }`
 * - Si no llega `chatId`: se trata como conversación nueva (se genera un chatId, sin historial previo).
 * - Si llega `chatId`: se recupera el historial de esa conversación desde MongoDB y se lo pasa
 *   a Gemini como turnos previos (role user/model) antes de la pregunta actual.
 *
 * Response: `{ success: boolean, status: number, chatId: string, data: string }`
 */
app.post("/ask-questions", async (req, res) => {
    try {
        const { prompt, chatId } = req.body;

        if (!prompt || !prompt.trim()) {
            return res.status(400).json({ error: "El campo 'prompt' es obligatorio", });
        }

        const resolvedChatId = chatId || crypto.randomUUID(); // chatId existente o generado para conversación nueva

        const dbAvailable = await connectDB().catch((error) => {
            console.error("No se pudo conectar a MongoDB:", error);
            return false;
        });

        // Solo recuperamos historial si es una conversación existente (llegó chatId)
        const history = (dbAvailable && chatId) ? await getChatHistory(chatId) : [];

        const result = await generateContentFromGemini(prompt.trim(), history, resolvedChatId);

        if (!result.data || !result.data.text) {
            return res.status(result.status).json({
                success: false,
                status: result.status,
                message: "No se pudo generar una respuesta. Intenta nuevamente en unos segundos.",
            });
        }

        if (dbAvailable) { // Con la respuesta, armamos el historial de chat para registro
            const chatHistory = {
                chatId: resolvedChatId,
                datetime: Date.now(),
                userQuestion: prompt,
                chatResponse: result.data.text
            };

            const ok = await saveChat(chatHistory);

            if (!ok) {
                console.error("No se pudo guardar el chat en MongoDB.");
            }
        }

        return res.status(result.status).json({
            success: true,
            status: result.status,
            chatId: resolvedChatId,
            data: result.data.text,
        });

    } catch (error) { // ⚠️ Ocultamos el error real
        console.error("Internal server error:", error);

        return res.status(500).json({
            success: false,
            message: "Error del servidor. Intenta nuevamente en unos segundos.",
        });
    }
});

// EJECUTAR
app.listen(PORT, () => console.log(`🚀 PROMPT ENGINEERING is running on port ${PORT}`));