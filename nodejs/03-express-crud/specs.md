# Descripción base: API de ejemplo con un CRUD al estilo ToDo App.
## Stack: Node JS con JavaScript ES6+ y la biblioteca Express JS.
## Persistencia: Archivo JSON.

### CRUD:
1. Se lee el archivo con datos y se carga en memoria.
2. GET -> Lista todas las tareas.
3. GET -> Lista una tarea por id.
4. GET -> Lista las tareas marcadas como completas.
5. GET -> Lista las tareas marcadas como incompletas.
6. GET -> Busca una tarea por palabra clave (en el título o la descripción)
7. POST -> Crea una tarea. 
8. PATCH -> Actualiza una tarea.
9. DELETE -> Borra una tarea.

### Modelo de datos: Entidad TAREA.

**Campos:**

1. id (uuid, manejado internamente)
2. title (String)
3. description (String)
4. priority (low, mid, high)
5. completed (Boolean, default = false)
6. createdAt (timestamp, default = fecha y hora actual)
7. updatedAt (timestamp, default, lo mismo que createdAt)

---

**Protocolo para el manejo del archivo JSON:**

- Crear un módulo independiente.
- Abrir el archivo y guardar en memoria.
- Cada operación POST, PATCH o DELETE sobrescribe el archivo JSON y vuelve a cargarlo en memoria para que los datos estén actualizados y sincronizados.
- Manejo de errores para evitar inconsistencias.
  
**Reglas generales:**

- Utiliza la skill instalada para este proyecto.
- Más simple es mejor, pero sin que ello introduzca malas prácticas o antipatrones.
- Es un proyecto básico y de características educativas, documenta con comentarios.
- Sigue los estándares API REST.
- Prefiere módulos nativos de Node JS en vez de paquetes externos siempre que sea posible.