import { sleep } from "./sleep.js";

async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${url}`);
    }
    return res.json();
}

async function getUsersWithPosts() {
    await sleep(1300);

    const [users, posts] = await Promise.all([
        fetchJson("https://jsonplaceholder.typicode.com/users"),
        fetchJson("https://jsonplaceholder.typicode.com/posts")
    ]);

    // join eficiente
    const postsByUser = posts.reduce((acc, post) => {
        if (!acc[post.userId]) acc[post.userId] = [];
        acc[post.userId].push(post.title);
        return acc;
    }, {});

    return users.map(user => ({
        user: user.name,
        posts: postsByUser[user.id] || []
    }));
}

export async function run() {
    const data = await getUsersWithPosts();
    data.forEach(item => console.log(item));
}