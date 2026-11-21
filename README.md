# Gestor de pedidos de material

Práctica de integración de **Desarrollo Web en Entorno Cliente** (sesiones 8-13).

Aplicación web 100 % en el navegador (HTML + CSS + JavaScript, sin frameworks, sin backend, sin base de datos y sin `localStorage`) para consultar un catálogo, gestionar un carrito y confirmar pedidos. Los datos viven en memoria: al recargar la página se pierden.

**Autor:** Adrián López Atalaya

## 1. Cómo ejecutar la aplicación (por HTTP, no `file://`)

La aplicación debe servirse con un servidor HTTP local de archivos estáticos. Desde la carpeta del proyecto, con cualquiera de estas opciones:

```bash
npx serve . -l 3000             # Node: http://localhost:3000
```

Otra opción es la extensión **Live Server** de VS Code ("Go Live"), que sirve en `http://127.0.0.1:5500/index.html` y es la que se ha usado en las evidencias de este documento.

No requiere instalar dependencias ni compilar nada. Se abre `index.html` desde el servidor y la aplicación arranca sola.

## 2. Estructura de carpetas

```
gestor-pedidos/
├── index.html              Estructura de la página y formulario (con novalidate)
├── README.md
├── css/
│   └── estilos.css         Estilos
├── js/
│   ├── datos.js            Constantes de negocio y colecciones: catalogo, carrito, pedidos
│   ├── main.js             Arranque y utilidades de interfaz compartidas
│   ├── modelo/
│   │   └── Producto.js     Clase Producto
│   ├── logica/             Funciones puras (no tocan el DOM)
│   │   ├── calculos.js     Cálculos económicos
│   │   └── validacion.js   Validación de datos
│   └── ui/                 Todo lo que lee o modifica el DOM
│       ├── catalogo.js     Búsqueda, filtro y tarjetas de producto
│       ├── carrito.js      Operaciones del carrito y su pintado
│       ├── formulario.js   Formulario: validación en pantalla y confirmación del pedido
│       └── historial.js    Creación de pedidos, historial, filtro y exportación JSON
└── docs/
    └── capturas/           Capturas de las evidencias
```

**Orden de carga** en `index.html`. Se usa `defer`, de modo que los scripts se descargan en paralelo pero se ejecutan en este orden, una vez construido el HTML. El orden importa porque cada fichero usa lo definido en los anteriores:

`Producto.js` → `datos.js` → `calculos.js` → `validacion.js` → `catalogo.js` → `carrito.js` → `formulario.js` → `historial.js` → `main.js`

## 3. Funcionalidades: ficheros, clases y funciones que intervienen

| Funcionalidad | Ficheros | Clases / funciones |
|---|---|---|
| Datos en memoria | `js/datos.js`, `js/modelo/Producto.js` | `Producto` (constructor, `hayDisponibilidad`, `descontar`), `datosProductos`, `catalogo`, `carrito`, `pedidos` |
| Catálogo | `js/ui/catalogo.js` | `crearTarjetaProducto`, `renderCatalogo`, `poblarCategorias` |
| Búsqueda y filtro por categoría | `js/ui/catalogo.js` | `filtrarProductos`, `obtenerCategorias` |
| Añadir al carrito | `js/ui/carrito.js`, `js/ui/catalogo.js`, `js/logica/validacion.js` | `agregarAlCarrito`, `validarCantidad`, delegación de eventos en `iniciarCatalogo` |
| Retirar línea | `js/ui/carrito.js` | `retirarDelCarrito`, delegación de eventos en `iniciarCarrito` |
| Vista del carrito | `js/ui/carrito.js` | `renderCarrito`, `crearLineaCarrito` |
| Cálculos (subtotal, descuento, total) | `js/logica/calculos.js` | `calcularSubtotal`, `calcularDescuento(subtotal, porcentaje = 0)`, `obtenerPorcentajeDescuento`, `calcularTotal`, `calcularResumenPedido`, `redondear2`, `formatearImporte` |
| Validación del pedido | `js/logica/validacion.js`, `js/ui/formulario.js` | `validarDatosPedido`, `REGEX_NOMBRE`, `REGEX_EMAIL`, `REGEX_CP`, `validarFormulario`, `mostrarErrores`, `manejarEdicion` |
| Campos condicionales de envío | `js/ui/formulario.js` | `actualizarCamposEntrega` |
| Contador de observaciones | `js/ui/formulario.js` | `actualizarContador` |
| Comprobación de stock | `js/logica/validacion.js`, `js/modelo/Producto.js` | `validarStockCarrito`, `Producto.hayDisponibilidad` |
| Confirmación del pedido | `js/ui/formulario.js`, `js/ui/historial.js` | `manejarEnvio`, `crearPedido`, `siguienteIdPedido`, `Producto.descontar` |
| Historial y detalle | `js/ui/historial.js` | `renderHistorial`, `crearEntradaHistorial` |
| Filtro y resumen del historial | `js/ui/historial.js`, `js/logica/calculos.js` | `filtrarPedidos`, `calcularResumenPedidos` |
| Exportar JSON | `js/ui/historial.js` | listener de `#btn-exportar`, `JSON.stringify` |

### Decisiones de diseño relevantes

- **Funciones puras frente a DOM.** Las funciones de `js/logica/` (`calcularSubtotal`, `calcularDescuento`, `validarDatosPedido`...) reciben datos por parámetros y devuelven resultados, sin leer ni modificar el DOM. Las funciones `render*`, `crear*` de tarjetas y líneas, y `mostrar*` son las que actualizan la interfaz.
- **Una única fuente de verdad.** El carrito guarda solo `{ productoId, cantidad }`. El precio y el stock se consultan siempre en el catálogo, de modo que no pueden quedar desincronizados.
- **Añadir al carrito no descuenta stock.** Las existencias solo bajan cuando un pedido se confirma correctamente. Al añadir se valida la cantidad total (la que ya había más la nueva) frente al stock, y al confirmar se vuelve a comprobar.
- **Importes numéricos.** Se redondea a céntimos con `redondear2` (devuelve un número) y solo se convierte a texto en `formatearImporte`, justo al mostrarlo. Así se evitan errores de coma flotante en el umbral de 100 €.
- **Orden al confirmar un pedido.** Primero se valida todo (formulario, carrito vacío y stock) sin modificar nada. Solo si todo es correcto se descuenta el stock, se guarda el pedido, se vacía el carrito y se repintan las vistas. Si hay un problema, no cambia ninguna colección y no se pierden los datos escritos.
- **Validación combinada.** Se usan atributos HTML (`required`, `minlength`, `maxlength`, `pattern`) junto con validación JavaScript mediante la Constraint Validation API (`setCustomValidity`, `validity`, `checkValidity`, `reportValidity`). El formulario lleva `novalidate` y se gestiona desde el evento `submit` con `preventDefault()`.
- **Campos condicionales.** El bloque de dirección y código postal es un `fieldset` que se deshabilita y oculta con la entrega "recogida". Los controles deshabilitados quedan fuera de la validación y de `FormData`, así que no se conservan errores de campos que no aplican.
- **Delegación de eventos.** Los botones "Añadir al carrito" y "Retirar" no tienen listener propio: hay uno en el contenedor (`#catalogo`, `#lineas-carrito`) que usa `event.target.closest(...)`. Así funciona con elementos que se crean y destruyen al repintar.
- **DOM seguro.** Se usa `createElement`, `textContent` y `append`. No se usa `innerHTML` con datos del usuario.
- **Historial como "foto" del momento.** Cada pedido guarda copias del nombre y el precio de sus líneas, por lo que no cambia aunque después cambie el catálogo.
- **Exportar historial** vuelca el historial completo, no solo el filtrado.
- **Botón "Confirmar pedido" siempre habilitado.** Si el carrito está vacío, al pulsarlo se muestra el motivo.

## 4. Casos de prueba reproducibles en el navegador

**Estado inicial** al cargar la página: catálogo de 8 productos, carrito vacío e historial vacío. Recarga la página (F5) para volver a este estado antes de cada bloque si lo necesitas.

**Catálogo de productos:**

| Id | Producto | Categoría | Precio | Stock |
|---|---|---|---|---|
| 101 | Ratón USB | Periféricos | 12,50 € | 8 |
| 102 | Teclado | Periféricos | 24,90 € | **0** |
| 103 | Monitor 24" | Periféricos | 129,99 € | 3 |
| 104 | Pendrive 64 GB | Almacenamiento | 9,95 € | 20 |
| 105 | Disco SSD 1 TB | Almacenamiento | 79,90 € | 5 |
| 106 | Cuaderno A5 | Oficina | 3,20 € | 50 |
| 107 | Grapadora | Oficina | 7,45 € | 12 |
| 108 | Auriculares | Periféricos | 39,90 € | 2 |

### T1. Catálogo
| Pasos | Resultado esperado |
|---|---|
| Cargar la página | 8 tarjetas con nombre, categoría, precio, existencias y campo de cantidad. Mensaje "Mostrando 8 de 8 productos." |
| Observar la tarjeta "Teclado" | Muestra "Agotado"; el campo de cantidad y el botón están deshabilitados. |

### T2. Búsqueda y filtro (incluye filtro sin resultados)
| Pasos | Resultado esperado |
|---|---|
| Escribir `RATÓN` en el buscador (en mayúsculas) | Solo aparece "Ratón USB" (no distingue mayúsculas de minúsculas). |
| Borrar el texto y elegir la categoría "Oficina" | Solo "Cuaderno A5" y "Grapadora". |
| Categoría "Oficina" + texto `ratón` (criterios combinados) | Ningún producto y mensaje "No se ha encontrado ningún producto con esos criterios." |

### T3. Añadir al carrito, suma de cantidades y errores de cantidad
| Pasos | Resultado esperado |
|---|---|
| Ratón USB, cantidad `2`, "Añadir al carrito" | Una línea "Ratón USB — 2 x 12,50 € — 25,00 €"; total de unidades 2. La existencia del catálogo **sigue en 8**. |
| Ratón USB, cantidad `3`, "Añadir al carrito" | **Suma de cantidades:** sigue habiendo UNA línea, ahora con cantidad 5 (62,50 €). |
| **Stock insuficiente:** Monitor, cantidad `4` | Se rechaza con "La cantidad supera el stock disponible (3)." El carrito no cambia. |
| Monitor `2` (se añade) y, a continuación, Monitor `2` otra vez | El segundo se rechaza con "Ya tienes 2 en el carrito y solo hay 3 en stock." |
| Cantidad vacía (borrar el campo) | "Indica una cantidad." |
| Cantidad `0` y cantidad `-1` | "La cantidad debe ser mayor que cero." |
| Cantidad `1.5` | "La cantidad debe ser un número entero." |
| Corregir el valor en el campo tras un error | El mensaje de error desaparece. |
| **Producto agotado:** intentar pulsar "Añadir al carrito" en Teclado | No es posible: el botón está deshabilitado. |

### T4. Retirar líneas (delegación de eventos)
| Pasos | Resultado esperado |
|---|---|
| Con Ratón y Monitor en el carrito, pulsar "Retirar" en la línea del Ratón | Desaparece solo esa línea y el resumen se recalcula. |
| Pulsar "Retirar" en la última línea | Mensaje "El carrito está vacío. Añade productos desde el catálogo." y se oculta el resumen. |

### T5. Carrito vacío
| Pasos | Resultado esperado |
|---|---|
| Con el carrito vacío, rellenar el formulario correctamente y pulsar "Confirmar pedido" | No se crea ningún pedido. Mensaje "El carrito está vacío: añade al menos un producto." Los datos del formulario se conservan. |

### T6. Cálculos y umbral de 100 €
| Pasos (carrito vacío al empezar) | Resultado esperado |
|---|---|
| Ratón USB x7 | Subtotal 87,50 €; descuento 0,00 €; total 87,50 € (por debajo del umbral). |
| Añadir 1 Ratón más (8 en total) | Subtotal **100,00 €**; descuento 10,00 € (10 %); total 90,00 €. El umbral "alcanza o supera" ya aplica descuento. |
| Vaciar el carrito; Monitor x1 | Subtotal 129,99 €; descuento 13,00 €; total 116,99 €. |
| Vaciar el carrito; Pendrive x10 | Subtotal 99,50 €; sin descuento. |

### T7. Validación del formulario (nombre, correo, observaciones, aceptación)
Con al menos un producto en el carrito:

| Pasos | Resultado esperado |
|---|---|
| Nombre: solo espacios `"   "` y salir del campo | Error "Indica tu nombre y apellidos." (el navegador lo daría por relleno; lo detecta JavaScript con `trim`). |
| Nombre: `A` | Error "El nombre debe tener entre 2 y 60 caracteres." |
| **Nombre con números o símbolos:** `145`, `Ana23`, `Ana_Pérez` | Error "El nombre solo puede contener letras, espacios, guiones y apóstrofos." |
| Nombre con doble espacio: `Ana  Pérez` | Error (los separadores deben ir entre palabras, de uno en uno). |
| Nombres válidos: `Ana`, `José Núñez`, `Pérez-Gómez`, `O'Brien` | Sin error. |
| **Correo inválido:** `pepe@`, `pepe@dominio`, `pepe dominio.es` | Error "El correo electrónico no tiene un formato válido (ejemplo: nombre@dominio.es)." |
| Correo `pepe@dominio.es` | El error desaparece. |
| Escribir en Observaciones | El contador muestra `n/200` y se actualiza con cada tecla; no se pueden escribir más de 200 caracteres. |
| Pulsar "Confirmar pedido" sin marcar la casilla de confirmación | Error "Debes confirmar que los datos del pedido son correctos."; no se crea el pedido. |

### T8. Cambio de modalidad y código postal inválido
| Pasos | Resultado esperado |
|---|---|
| Por defecto, modalidad Recogida | No se ven los campos de dirección ni de código postal. |
| Elegir Envío | Aparecen Dirección y Código postal. |
| **Código postal inválido:** probar `1234`, `00123`, `53000`, `41A01`, `4100` | Todos dan el error "Código postal no válido: 5 cifras y provincia entre 01 y 52." |
| Código postal válido: `41001`, `01001`, `52001` | Sin error. |
| Dirección `abc` | Error "La dirección debe tener entre 5 y 100 caracteres." |
| Con errores de dirección o código postal visibles, cambiar a Recogida | Los campos se ocultan y desaparecen sus errores. |
| Confirmar un pedido válido con Recogida | Se crea el pedido sin pedir datos postales. |
| Confirmar un pedido válido con Envío (dirección `Calle Sol 5`, CP `41001`) | Se crea el pedido y el historial lo muestra como "Envío". |

### T9. Confirmación del pedido (stock, carrito, historial)
| Pasos | Resultado esperado |
|---|---|
| Añadir Ratón x3; rellenar el formulario (Recogida, casilla marcada); confirmar | Mensaje "Pedido #1 confirmado. Total: ..." El carrito queda vacío; el stock del Ratón pasa de 8 a **5**; el formulario se vacía; el pedido aparece en el historial. |
| Confirmar con un dato inválido (por ejemplo, un correo erróneo) | No cambia nada (ni stock, ni carrito, ni historial) y los datos escritos se conservan. |
| **Stock insuficiente al confirmar:** añadir Monitor x2; en DevTools → Consola ejecutar `catalogo.find(p => p.id === 103).stock = 1`; confirmar | Error "Stock insuficiente de "Monitor 24"": pides 2 y quedan 1." No se crea el pedido ni se modifica el stock. |

### T10. Historial, filtro y detalle
Crear dos pedidos, uno con Recogida (87,50 €) y otro con Envío (116,99 €):

| Pasos | Resultado esperado |
|---|---|
| Ver el historial | Dos entradas con número, fecha, nombre, modalidad y total. "Pedidos: 2 · Suma de importes: 204,49 €". |
| Pulsar sobre una entrada | Se despliega el detalle: líneas con nombre, cantidad, precio de ese momento e importe, y subtotal, descuento y total. |
| Filtro "Recogida" / "Envío" | Solo aparecen los pedidos de esa modalidad; el recuento y la suma se calculan sobre los filtrados. |
| **Filtro sin resultados:** recargar, crear solo un pedido de Recogida y filtrar por "Envío" | Mensaje "Ningún pedido cumple el filtro seleccionado." y "Pedidos: 0 · Suma de importes: 0,00 €" (sin `NaN`). |
| Recargar la página (historial vacío) | Mensaje "Todavía no hay pedidos confirmados." |
| Hacer un segundo pedido del mismo producto tras bajar el stock | Las líneas del pedido antiguo siguen mostrando el nombre y el precio de su momento. |

### T11. Exportar historial (JSON)
| Pasos | Resultado esperado |
|---|---|
| Con pedidos, pulsar "Exportar historial" | Aparece un área de texto con el JSON (`id`, `fecha`, `cliente`, `entrega`, `lineas`, `subtotal`, `descuento`, `total`), seleccionado y listo para copiar. |
| Sin pedidos, pulsar "Exportar historial" | El área de texto muestra `[]`. |

## 5. Evidencia de depuración con punto de interrupción

<img width="561" height="752" alt="Depuración en calculos.js con punto de interrupción" src="https://github.com/user-attachments/assets/91e52b0f-193d-43f4-ac43-09d7eb88d2fd" />

**Qué se hizo.** Con DevTools abierto (pestaña *Sources*), se puso un punto de interrupción en la línea 18 de `js/logica/calculos.js`, dentro de `calcularSubtotal`:

`suma += producto.precio * linea.cantidad;`

Después se pulsó "Añadir al carrito" con 1 unidad de Ratón USB. Al repintar el carrito se llama a `calcularResumenPedido`, que llama a `calcularSubtotal`, y la ejecución se detuvo (*Debugger paused*).

**Qué se observó.**
- En el panel *Scope → Local*, `carrito` contiene una línea (`{productoId: 101, cantidad: 1}`) y `catalogo` contiene los 8 productos.
- Avanzando paso a paso, la variable `suma` pasó de `0` a `12.5`, que es `precio (12,50 €) × cantidad (1)`. En la captura, la ejecución está parada en la línea 21 (`return redondear2(suma)`) con `suma = 12.5`.
- En *Call Stack* aparece `calcularSubtotal` en `calculos.js:21`, lo que confirma qué función se está ejecutando y que la llamó el cálculo del resumen del carrito.

**Qué se comprobó.** Que el subtotal se acumula correctamente línea a línea y que el valor que se devuelve (12,5) coincide con el importe que se muestra después en el carrito. Si el cálculo fallara, este punto de interrupción permitiría ver en qué iteración `suma` toma un valor incorrecto.

## 6. Evidencia en la pestaña Network

<img width="584" height="981" alt="Pestaña Network con la carga de los ficheros por HTTP" src="https://github.com/user-attachments/assets/9663d7aa-be0c-4a78-9693-709cfce5a33c" />

**Qué se hizo.** Con DevTools abierto en la pestaña *Network* y la opción *Disable cache* activada, se recargó la página servida con Live Server en `http://127.0.0.1:5500/index.html`.

**Qué se observó.**
- Se realizaron 13 peticiones (48,3 kB transferidos) y `DOMContentLoaded` se produjo a los 59 ms.
- `index.html` (tipo *document*), `css/estilos.css` (tipo *stylesheet*) y los 9 ficheros JavaScript (tipo *script*) respondieron con **estado 200**, por lo que se cargaron correctamente por HTTP y no por `file://`.
- La columna *Initiator* indica que los scripts se piden desde `index.html:151` hasta `index.html:159`, en el mismo orden en que se declaran las etiquetas `<script defer>`: `Producto.js`, `datos.js`, `calculos.js`, `validacion.js`, `catalogo.js`, `carrito.js`, `formulario.js`, `historial.js` y `main.js`.
- La entrada `ws` (estado 101) es la conexión WebSocket que usa Live Server para recargar la página automáticamente. No forma parte de la aplicación.
- `favicon.ico` devuelve 404: el navegador pide ese icono de pestaña de forma automática y el proyecto no incluye ninguno. No afecta al funcionamiento de la aplicación.

**Qué se comprobó.** Que todos los recursos de la aplicación se sirven correctamente desde el servidor local y que el orden de carga es el esperado.
