import { sleep } from "./sleep.js";

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${url}`);
    }
    return res.json();
}

// Obtiene cada usuario junto con los títulos de sus posts.
// Hace ambas peticiones en paralelo con Promise.all para no esperar
// una antes de lanzar la otra.
async function getUsersWithPosts() {
    await sleep(1300);

    // Lanzamos las dos peticiones al mismo tiempo. Sin Promise.all
    // habría que esperar ~300ms por users y ~300ms por posts en serie;
    // así ambas viajan en paralelo y el tiempo total es el del más lento.
    const [users, posts] = await Promise.all([
        fetchJson("https://jsonplaceholder.typicode.com/users"),
        fetchJson("https://jsonplaceholder.typicode.com/posts")
    ]);

    // JOIN EFICIENTE — construimos un índice { userId → [título, título, ...] }
    // recorriendo los posts UNA sola vez.
    //
    // Alternativa ingenua (no usar):
    //   users.map(user => posts.filter(p => p.userId === user.id))
    // Eso recorre posts por completo para cada usuario → O(usuarios × posts).
    //
    // Con el índice, buscar los posts de un usuario es O(1) por clave de objeto,
    // así que el coste total baja a O(posts + usuarios).
    const postsByUser = {};
    for (const post of posts) {
        // Si es la primera vez que vemos este userId, creamos su lista vacía.
        if (!postsByUser[post.userId]) {
            postsByUser[post.userId] = [];
        }
        postsByUser[post.userId].push(post.title);
    }

    // Ahora combinamos: para cada usuario, buscamos sus posts en el índice.
    // Si un usuario no tiene posts, devolvemos [] en lugar de undefined.
    const result = [];
    for (const user of users) {
        result.push({
            user: user.name,
            posts: postsByUser[user.id] || []
        });
    }
    return result;
}

export async function run() {
    const data = await getUsersWithPosts();
    data.forEach(item => console.log(item));
}
run();