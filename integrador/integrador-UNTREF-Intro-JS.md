# Módulo de introducción a JS - Ejercicio Integrador

## Países del Mundo

### API de referencia

[Rest Countries](https://restcountries.com/)

URL base: https://restcountries.com/v3.1

Todas las peticiones a esta API comienzan en la URL base y se agrega al final el endpoint. Un endpoint es una ruta de entrada al servidor que permite obtener información específica.

La API devolverá un objeto en formato JSON que estará encapsulado dentro del cuerpo de la respuesta del servidor. Para poder usar esos datos hay que convertirlos a objeto JavaScript válido con el método .json(), tal como vimos en clase y en el material de lectura subido al campus.

**¿Cómo saber qué campos (fields) tiene un objeto de tipo "país"?**
Simple. Siempre que trabajamos con una API tenemos que leer la documentación. En este caso, si miran en la página de la API, verán un link que ofrece toda esa información:

_Check the [FIELDS.md](https://gitlab.com/restcountries/restcountries/-/blob/master/FIELDS.md) file for a description of each field._

Entran ahí y van a ver la estructura típica de un país con todos los campos que posee. A los campos también se le puede llamar propiedades.

### Ejemplo de uso

Obtener todos los países y mostrar el nombre, las monedas oficiales, la población y la sub región en la que se encuentra:
https://restcountries.com/v3.1/all?fields=name,currencies,population,subregion


### Parte 1.

- Obtener una lista de todos los países con su nombre y su población y almacenarla en un array.

- Mostrar en pantalla un mensaje del estilo "Total de países: " y el número total.

- Mostrar la lista de países con su nombre común. No el nombre completo con todas sus propiedades, solo el nombre común. Tengan presente que el campo "name" no es un _string_ sino un _object_ que contiene a su vez otras propiedades.

- Ahora mostrar la misma lista pero agregando como prefijo un número, iniciando en 1*. Por ej:
	- 1 - Argentina
	- 2 - Mauritania
	- 3 - Italia...
	- 
	\* Esto se puede resolver con un ciclo __for__, utilizando el __iterador__ como número cardinal. Otra posibilidad es utilizar un __array.forEach()__ o un __arra.map()__. 
	
	Estos métodos aceptan varios argumentos. El primer es el elemento individual en cada ciclo de la iteración. 
	
	¿Y el segundo? 
	¿Me puede servir para resolver el enunciado?
	
	[Documentación método forEach()](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach)
	[Documentación método map()](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Array/map)


- Mostrar en pantalla la suma de la población de todos los países. Si el número es muy grande y difícil de leer, por ejemplo 4560098763, buscar un método nativo que permita formatear un dato de tipo "number" para su mejor visualización
	- [Ayuda - MDN](https://developer.mozilla.org/es/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString)

---

### Parte 2.

- Obtener la lista de países ubicados en la región "america" (pueden escribir "america" o "americas" y la api lo va a entender). Traigan los campos _name, region, subregion, population_ 
- Una vez que tengan la lista cuenten el total de países.

- Ordenen por _name.common_ (Nombre común - A a Z)
- Ordenen por _name.common_ (Nombre común - Z a A)
- Ordenen por subregión para que los resultados se agrupen por Sur, Central, Norte, etc.
- Ordenen por población:
	- De menor a mayor
	- De mayor a menor

---

### Parte 3.

Con la lista de países original obtenida en la _Parte 2_, crear un nuevo arreglo que contenga solamente los países del Caribe.

Si bien la API permite hacer eso muy fácilmente trayendo los países por sub región, no vamos a usar esa capacidad.

Necesitamos la misma lista completa con todos los países del continente americano y nosotros haremos el filtrado para que solo queden los del caribe.

---

### Parte 4.

En esta sección vamos a trabajar con el Índice GINI.

Si no sabés qué es, ==acá va un resumen==: 

El ==índice de Gini==, o coeficiente de Gini, es una medida económica desarrollada por [Corrado Gini](https://www.google.com/search?q=Corrado+Gini&rlz=1C1UEAD_esAR1097AR1097&oq=gini+index&gs_lcrp=EgZjaHJvbWUyCQgAEEUYORiABDIHCAEQABiABDIHCAIQABiABDIHCAMQABiABDIHCAQQABiABDIHCAUQABiABDIHCAYQABiABDIHCAcQABiABDIHCAgQABiABDIHCAkQABiABNIBCDI2MzFqMGo3qAIAsAIA&sourceid=chrome&ie=UTF-8&ved=2ahUKEwihz4iAroSUAxW0ppUCHfD_FsQQgK4QegYIAQgAEAQ) (1912) que cuantifica la desigualdad de ingresos o riqueza dentro de una población. 
Su valor oscila entre 0 y 1 (o 0 y 100), donde 0 representa la igualdad perfecta (todos tienen el mismo ingreso) y 1 la desigualdad máxima (una persona concentra todo el ingreso).

- Realizar una petición a la API y traer, de los __países de habla hispana__ los campos __name y gini___.
- Mostrar en pantalla los países. Allí donde no haya dato estadístico disponible para el campo "gini", mostrar "N/A".
- Mostrar los datos ordenados por índice Gini, de menor a mayor.\** 

\** ¿Algún detalle que les llame la atención sobre el listado obtenido en el paso anterior? ¿Qué pasa con los países donde no hay datos disponibles? 

___Aquí la explicación de los que ves en pantalla:___ 
**"N/A" es un string**. Cuando el código intenta hacer `"N/A" - 40`, el resultado es `NaN` `Not a Number`, lo que rompe el orden de la lista porque SORT no sabe como operar con un resultado que no es un número para determinar en qué orden debe ir.

- Intente resolver el problema. Tenga en cuenta que cuando no existe el valor, la propiedad ==gini== es un objeto vacío. En ese caso, una buena solución sería que el objeto resultante quedara más o menos así: `{name: "Cuba", gini: null}`

- Para lograr eso, dentro de un bucle, podemos crear cada objeto poniendo en el campo ==name== el valor que traigan los datos y en el campo ==gini==, primero chequear si el objeto está vacío, en cuyo caso pondremos como valor `null`. Si no es un objeto vacío simplemente propagaremos el valor que traiga ese campo.