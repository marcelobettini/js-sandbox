import express from 'express';
import { connectToDatabase } from './src/db/client.js';
import healthRouter from './src/routes/health.js';
import tasksRouter from './src/routes/tasks.js';

const PORT = process.env.PORT || 3000;
const API_PREFIX = "/api";
const server = express();

server.use(express.json());

server.use("/health", healthRouter);
server.use(`${API_PREFIX}/tasks`, tasksRouter);

server.use((req, res, next) => {
    const error = new Error(`Not Found: ${req.method} ${req.originalUrl}`);
    error.status = 404;
    next(error);
});

server.use((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).json({ status, error: err.message || 'Internal Server Error' });
});

async function main() {
    await connectToDatabase();
    server.listen(PORT, () => {
        console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
}

main().catch((err) => {
    console.error('Error al iniciar la aplicación:', err);
    process.exit(1);
});
