const res = await fetch('https://restcountries.com/v3.1/lang/spanish?fields=name,gini');
console.log(res);
const data = await res.json();
console.log(data);

// const transformed = data.map(el => ({
//     name: el.name.common,
//     // Extraemos el primer valor y lo aseguramos como número
//     gini: el.gini && Object.keys(el.gini).length > 0
//         ? Object.values(el.gini)[0]
//         : 'N/A'
// }));

// const sortedByGini = transformed.toSorted((a, b) => {
//     // Si ambos son null, se mantienen igual
//     if (a.gini === b.gini) return 0;
//     // Si 'a' es null, lo mandamos al final
//     if (a.gini === 'N/A') return 1;
//     // Si 'b' es null, lo mandamos al final
//     if (b.gini === 'N/A') return -1;
//     // Resta numérica estándar
//     return a.gini - b.gini;
// });

// console.log(sortedByGini);

// //delay no bloqueante
// const sleep = (ms) =>  new Promise(resolve => setTimeout(resolve, ms))



// async function fetchJson(url) {
//   const res = await fetch(url)
//   if (!res.ok) {
//     throw new Error(`HTTP ${res.status} - ${url}`)
//   }
//   return res.json()
// }

// async function getUsersWithPosts() {
//   await sleep(1300)

//   const [users, posts] = await Promise.all([
//     fetchJson("https://jsonplaceholder.typicode.com/users"),
//     fetchJson("https://jsonplaceholder.typicode.com/posts")
//   ])

//   // join eficiente
//   const postsByUser = posts.reduce((acc, post) => {
//     if (!acc[post.userId]) acc[post.userId] = []
//     acc[post.userId].push(post.title)
//     return acc
//   }, {})

//   return users.map(user => ({
//     user:user.name,
//     posts: postsByUser[user.id] || []
//   }))
// }

// const data = await getUsersWithPosts()
// data.forEach(item => console.log(item))