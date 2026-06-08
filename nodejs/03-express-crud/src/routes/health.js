// Endpoint de salud: verifica que el servidor y la conexión a MongoDB responden.
// Montado en /health, fuera del prefijo /api/v1 — es infraestructura, no dominio.

import { Router } from 'express';
import { getDb } from '../db/mongoClient.js';

const router = Router();

// GET /health
// 200 → todo operativo
// 503 → servidor vivo pero MongoDB no responde
//
// No delega a next(err): este handler siempre devuelve una respuesta estructurada,
// incluso en fallo. Los orquestadores y load balancers (k8s, Railway, nginx) leen
// el código HTTP del /health para decidir si sacar la instancia de rotación;
// necesitan una respuesta, no un error sin capturar.
router.get('/', async (req, res) => {
  const timestamp = new Date().toISOString();

  try {
    // ping es el comando más liviano de MongoDB; confirma conectividad sin tocar datos
    await getDb().command({ ping: 1 });
    res.json({ status: 'ok', db: 'ok', timestamp });
  } catch {
    // 503 Service Unavailable: el servidor corre pero su dependencia crítica no responde
    res.status(503).json({ status: 'error', db: 'unreachable', timestamp });
  }
});

export default router;
