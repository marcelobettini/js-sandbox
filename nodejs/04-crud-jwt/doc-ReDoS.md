# ReDoS — Regular Expression Denial of Service

**ReDoS** (Denegación de Servicio por Expresión Regular) es un tipo de ataque DoS que explota la forma ineficiente en que algunos motores de software evalúan expresiones regulares.

---

## ¿Cómo funciona?

Las expresiones regulares (regex) se usan habitualmente para buscar o validar patrones de texto (correos electrónicos, contraseñas, etc.).

Ciertos patrones mal construidos —conocidos como **"Evil Regex"**— pueden hacer que el motor entre en un bucle de evaluación exponencial al recibir una entrada específica. El procesador intenta probar **todas las combinaciones posibles** de caracteres fallando en el último paso, un proceso llamado **backtracking catastrófico**, que consume el 100 % de la CPU y congela la aplicación.

---

## Ejemplo de patrón vulnerable

Un patrón peligroso típico: `(a+)+` o `(\w+)*$`

| Elemento | Detalle |
|---|---|
| **Patrón** | Busca una o más letras `a` repetidas una o más veces |
| **Entrada maliciosa** | `aaaaaaaaaaaaaaaaaaaaaaaaX` (muchas `a` seguidas de una `X` que no coincide) |
| **Resultado** | El procesador intenta miles de millones de combinaciones; con ~30 caracteres puede bloquear el servidor por completo |

---

## ¿Cómo prevenirlo?

1. **Limitar la longitud de los inputs** — evitar que los usuarios envíen cadenas excesivamente largas para validar.
2. **Limitar el tiempo de evaluación** — algunos lenguajes permiten establecer un `timeout` al motor de regex.
3. **Auditar el código** — usar herramientas de análisis estático para identificar expresiones regulares vulnerables.
4. **Evitar cuantificadores anidados** — no combinar operadores repetitivos como `(a+)+` o `(a*)*` en una misma estructura.

---

> Más información sobre patrones vulnerables y reglas de validación seguras en el portal oficial de [OWASP](https://owasp.org).
