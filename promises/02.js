import { sleep } from "./sleep.js";

async function fetchJson(url, signal) {
    const res = await fetch(url, { signal });
    if (!res.ok) {
        throw new Error(`HTTP ${res.status} - ${url}`);
    }
    return res.json();
}

async function getUsersWithPosts({ signal } = {}) {
    await sleep(1300);

    const [users, posts] = await Promise.all([
        fetchJson("https://jsonplaceholder.typicode.com/users", signal),
        fetchJson("https://jsonplaceholder.typicode.com/posts", signal)
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

const data = await getUsersWithPosts();
data.forEach(item => console.log(item));