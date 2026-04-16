// readline/promises es el sub-módulo nativo de Node (desde v17) que expone
// la misma API pero con Promises en lugar de callbacks. Importamos solo
// createInterface para no traer todo el módulo readline al scope.
import { createInterface } from 'readline/promises';
import { run as run01 } from './01.js';
import { run as run02 } from './02.js';

// Al usar readline/promises, rl.question() ya devuelve una Promise,
// por lo que no necesitamos promisificarla manualmente.
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// SIGINT es la señal que envía el sistema operativo cuando el usuario presiona Ctrl+C.
// Con rl.on() escuchamos ese evento en la interfaz de lectura de líneas.
rl.on('SIGINT', () => {
    // Mostramos un mensaje de despedida antes de cerrar. El '\n' agrega
    // un salto de línea para que el mensaje no quede pegado al prompt '^C'.
    console.log('\nSesión interrumpida por el usuario. ¡Hasta luego!');

    // Cerramos el stream de readline para liberar el descriptor de entrada.
    // Si no lo hacemos, el proceso podría quedar "colgado" esperando input.
    rl.close();

    // Terminamos el proceso con código de salida 0, que por convención
    // significa "éxito / cierre limpio" (distinto de 1 que indicaría error).
    process.exit(0);
});


async function main() {
    let exit = false;
    while (!exit) {
        const answer = await rl.question("Elige una opción:\n1. Opción uno\n2. Opción dos\n3. Salir\n");
        switch (answer.trim()) {
            case '1':
                await run01();
                await rl.question("\nPresione Enter para volver al menú...");
                console.clear();
                break;
            case '2':
                await run02();
                await rl.question("\nPresione Enter para volver al menú...");
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


