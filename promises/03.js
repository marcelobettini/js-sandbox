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

    // JOIN EFICIENTE: agrupa los posts por userId en un objeto-mapa (O(n)).
    //
    // El problema: para cada usuario necesitamos saber qué posts le pertenecen.
    // La solución ingenua sería, dentro del users.map de abajo, filtrar el
    // array de posts con posts.filter(p => p.userId === user.id). Eso recorre
    // los ~100 posts por cada uno de los ~10 usuarios → O(usuarios × posts).
    //
    // En cambio, este reduce recorre los posts UNA sola vez y los indexa por
    // userId en un objeto plano. Acceder luego a postsByUser[user.id] es O(1)
    // (lookup por clave de objeto), así que el map final también es O(usuarios).
    // Coste total: O(posts + usuarios) en lugar de O(posts × usuarios).
    const postsByUser = posts.reduce((acc, post) => {
        if (!acc[post.userId]) acc[post.userId] = [];
        acc[post.userId].push(post.title);
        return acc;
    }, {});

    // Para cada usuario, buscamos sus posts en el mapa ya construido.
    // Si un usuario no tiene posts, devolvemos array vacío en lugar de undefined.
    return users.map(user => ({
        user: user.name,
        posts: postsByUser[user.id] || []
    }));
}

export async function run() {
    const data = await getUsersWithPosts();
    data.forEach(item => console.log(item));
}
