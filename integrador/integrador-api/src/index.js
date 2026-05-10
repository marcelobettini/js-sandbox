import express from "express";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

// ─── ¿Qué es __dirname y por qué hay que "crearlo" en ES Modules? ────────────
//
// __dirname es una cadena con la ruta absoluta del directorio que contiene el
// archivo que se está ejecutando. Sirve para construir rutas de archivos de
// forma portátil, sin importar desde dónde se invoca el proceso de Node.
//
// EN COMMONJS no hace falta crearlo: Node.js envuelve automáticamente cada
// archivo .js en una función antes de ejecutarlo, la llamada "module wrapper":
//
//   (function(exports, require, module, __filename, __dirname) {
//     // tu código va aquí
//   });
//
// Esa función recibe __dirname (y __filename) como parámetros, por eso están
// disponibles como si fueran variables globales en cualquier archivo .cjs.
// En realidad son locales a cada módulo, inyectadas por el runtime.
//
// EN ES MODULES ese wrapper ya no existe. El estándar ES Modules fue diseñado
// para ser independiente del entorno (browser, Node, Deno, workers…), y
// conceptos como "la ruta del archivo en disco" son específicos del sistema
// operativo: no tienen sentido en un browser. Por eso el comité TC39 decidió
// no incluirlos en la especificación del lenguaje.
//
// Lo que sí provee ESM es import.meta.url: una URL con el path del archivo
// actual (ej: "file:///home/user/proyecto/src/index.js"). A partir de ella

// podemos reconstruir __dirname con dos pasos:
//
//   1. fileURLToPath(import.meta.url)  →  convierte la URL a ruta del SO
//                                         ("/home/user/proyecto/src/index.js")
//   2. dirname(...)                    →  extrae solo el directorio
//                                         ("/home/user/proyecto/src")
//
// ¿Por qué se removió si seguimos necesitándolo?
// La respuesta corta es que ESM prioriza la portabilidad entre entornos sobre
// la comodidad de Node. El trade-off fue intencional: un módulo ES "puro" no
// asume que corre en un sistema de archivos. Node.js luego cubrió el caso de
// uso exponiendo import.meta.url y las utilidades de conversión, pero dejó la
// reconstrucción a cargo del desarrollador para dejar explícito que se está
// accediendo a una capacidad específica del entorno, no del lenguaje.
// ─────────────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const { localidades } = JSON.parse(
    readFileSync(join(__dirname, "data/cities.json"), "utf-8")
);

const app = express();
const PORT = 3000;

app.get("/localidades", (req, res) => {
    res.json(localidades);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
