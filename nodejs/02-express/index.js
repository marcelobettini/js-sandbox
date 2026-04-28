import express from "express";
import data from "../01-node_http/recipes.json" with { type: "json" };

const PORT = 3000;
const server = express();
server.disable("x-powered-by"); //security measure

server.get('/', (req, res) => {
    res.send('Hello World with Express JS, and an invalid status code');
});

server.get('/about', (req, res) => {
    res.send("About Page");
});
server.get('/recipes', (req, res) => {
    res.status(200).send(data.recipes);
});

server.get('/recipes/search', (req, res) => {

    const name = req.query?.name || null;

    const ingredient = req.query?.ingredient || null;
    let filteredResults = data.recipes;
    if (name) {
        filteredResults = filteredResults.filter(r => r.name.toLowerCase().includes(name.toLowerCase()));
    }

    if (ingredient) {
        filteredResults = filteredResults.filter(r => r.ingredients.some(i => i.toLowerCase().includes(ingredient.toLowerCase())));
    }

    filteredResults.length ? res.send(filteredResults) : res.status(404).json({ status: 404, message: "Recipe Not Found" });
});


server.use((req, res) => {
    res.status(404).json({ status: 404, message: 'Invalid Route' });
});

server.listen(PORT, (err) => {
    console.log(err ? err.message : `Server running on http://localhost:${PORT}`);
});

