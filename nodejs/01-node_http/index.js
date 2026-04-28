import http from "node:http";
import data from "./recipes.json" with { type: "json" };
const PORT = 3000;

const server = http.createServer((req, res) => {

    /*
        Para manejar rutas y query params de forma sencilla, utilizamos la clase URL.Esto nos permite acceder a la ruta y los parámetros de búsqueda de manera estructurada.
            
        - url.pathname nos da la ruta(por ejemplo, "/recipes/search")
        - url.searchParams nos permite acceder a los query params(por ejemplo, "name" o "ingredient") de forma fácil y legible.Esto hace que el código sea más limpio y mantenible en comparación con el manejo manual de la cadena de consulta.
        */

    const url = new URL(req.url, `http://${req.headers.host}`);
    switch (url.pathname) {
        case "/":
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("Hello, World!");
            break;
        case "/about":
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end("About Page");
            break;
        case "/recipes":
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(data.recipes));
            break;
        case "/recipes/search":
            const name = url.searchParams.get("name");
            const ingredient = url.searchParams.get("ingredient");

            let filteredResults = data.recipes;

            if (name) {
                filteredResults = filteredResults.filter(r => r.name.toLowerCase().includes(name.toLowerCase()));
            }

            if (ingredient) {
                filteredResults = filteredResults.filter(r => r.ingredients.some(i => i.toLowerCase().includes(ingredient.toLowerCase())));
            }

            // versión escalable, si agregamos más filtros no tenemos que modificar la lógica de filtrado, solo agregar más condiciones al array de filtros. Aquí un ejemplo:
            // Para agregar el query param 'cuisine=Italian' en el futuro, solo añadís una línea: if (cuisine) filters.push(r => r.cuisine.toLowerCase() === cuisine.toLowerCase()).
            // const filters = [];
            // if (name) filters.push(r => r.name.toLowerCase().includes(name.toLowerCase()));            
            // if (ingredient) filters.push(r => r.ingredients.some(i => i.toLowerCase().includes(ingredient.toLowerCase())));

            // const result = data.recipes.filter(r => filters.every(fn => fn(r)));
            if (filteredResults.length) {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(filteredResults));
            } else {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: 404, message: "Recipe Not Found" }));
            }
            break;
        default:
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 - Route Not Found");

    }
});

server.listen(PORT, (err) => {
    console.log(err ? err.message : `Server running on http://localhost:${PORT}`);
});