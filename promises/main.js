import readline from 'readline';
import { run as run01 } from './01.js';
import { run as run02 } from './02.js';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('SIGINT', () => {
    console.log('\nSesión interrumpida por el usuario. ¡Hasta luego!');
    rl.close();
    process.exit(0);
});

function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}


async function main() {
    let exit = false;
    while (!exit) {
        const answer = await askQuestion("Elige una opción:\n1. Opción uno\n2. Opción dos\n3. Salir\n");
        switch (answer.trim()) {
            case '1':
                await run01();
                await askQuestion("\nPresione Enter para volver al menú...");
                console.clear();
                break;
            case '2':
                await run02();
                await askQuestion("\nPresione Enter para volver al menú...");
                console.clear();
                break;
            case '3':
                console.log("Saliendo...");
                exit = true;
                break;
            default:
                console.log("Opción no válida. Por favor, elige una opción válida.");
        }
    }
    rl.close();
}

main();


