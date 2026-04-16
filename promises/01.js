import { sleep } from './sleep.js';

async function getDataFromApi() {
    let loading = true;

    try {
        console.log("Cargando datos...");
        await sleep(1300);

        const response = await fetch("https://jsonplaceholder.typicode.com/users");

        if (!response.ok) {
            throw new Error("Error en el servidor: " + response.status);
        }

        const users = await response.json();
        return users;
    } catch (err) {
        console.error(err.message);
    } finally {
        loading = false;
    }
}

const users = await getDataFromApi();
if (users !== undefined) {
    console.clear();
    users.forEach((usr) => {
        console.log(`${usr.id} ${usr.name}`);
    });
}
