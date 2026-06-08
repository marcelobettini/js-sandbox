# Descripción base: API de ejemplo con un CRUD al estilo ToDo App.
## Stack: Node JS con JavaScript ES6+ y la biblioteca Express JS.
## Persistencia: Archivo MongoDB Atlas.
## Autenticación y autorización: 
1. Contraseña encriptada con librería bcrypt
2. JSON WEB TOKENS con librería jsonwebtoken

### CRUD:
1. GET -> Lista todas las tareas.
2. GET -> Lista una tarea por id.
3. GET -> Lista las tareas marcadas como completas.
4. GET -> Lista las tareas marcadas como incompletas.
5. GET -> Busca una tarea por palabra clave (en el título o la descripción)
6. POST -> Crea una tarea.  
7. PATCH -> Actualiza una tarea.
8. DELETE -> Borra una tarea. (Ruta protegida por token a través de un middleware)

### AUTH:
1. POST /api/v1/auth/register -> Registra un usuario en la colección users
2. POST /api/v1/auth/login -> Verifica credenciales, emite access token (15min) en el body y refresh token (7d) en una httpOnly cookie
3. POST /api/v1/auth/refresh -> Lee el refresh token de la cookie, rota ambos tokens (access + refresh)
4. POST /api/v1/auth/logout -> Limpia la cookie del refresh token; responde 204

### Decisiones de diseño — AUTH:
- Refresh token: httpOnly cookie (invisible al cliente JS → protección XSS)
- Rotación: cada /refresh invalida el refresh token anterior y emite uno nuevo
- Logout stateless: no hay blocklist en DB; limpiar la cookie es suficiente para el scope educativo
- Rutas de tasks protegidas: POST, PATCH y DELETE requieren Bearer token válido en Authorization header
- GET /tasks y GET /tasks/:id son públicos (sin aislamiento por usuario)
- authorId se asigna automáticamente desde el payload del JWT al crear una tarea
- Timing attacks: /login siempre ejecuta bcrypt.compare aunque el usuario no exista (previene enumeración)

---

### Modelo de datos: Entidad TAREA.

**Campos:**

1. _id (uuid, manejado internamente)
2. title (String)
3. description (String)
4. priority (low, mid, high)
5. completed (Boolean, default = false)
6. authorId: Referencia al usuario logueado -> colección users
7. createdAt (timestamp, default = fecha y hora actual)
8. updatedAt (timestamp, default, lo mismo que createdAt)

### Modelo de datos: Entidad USER.

***Campos***

1. _id (uuid, manejado internamente)
2. email (String)
3. fullName (String)
4. password: (String hasheado con bcrypt)
5. createdAt (timestamp, default = fecha y hora actual)
6. updatedAt (timestamp, default, lo mismo que createdAt)
---
  
**Reglas generales:**

- Utiliza la skill instalada para este proyecto.
- Más simple es mejor, pero sin que ello introduzca malas prácticas o antipatrones.
- Es un proyecto básico y de características educativas, documenta con comentarios.
- Sigue los estándares API REST.
- Prefiere módulos nativos de Node JS en vez de paquetes externos siempre que sea posible.

