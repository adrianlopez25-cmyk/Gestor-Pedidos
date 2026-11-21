# Gestor de pedidos de material

Práctica de integración de **Desarrollo Web en Entorno Cliente**.
Aplicación web 100 % en el navegador (HTML + CSS + JavaScript, sin frameworks, sin backend, sin `localStorage`) para consultar un catálogo, gestionar un carrito y confirmar pedidos.

Autor: _<Adrián López Atalaya>

## 1. Cómo ejecutar la aplicación (por HTTP, no `file://`)

Desde la carpeta del proyecto, con cualquiera de estas opciones:

```bash
python3 -m http.server 8000     # opción A (Python)
npx serve .                     # opción B (Node)
```

Opción C: extensión **Live Server** de VS Code ("Go Live").

Abre `http://localhost:8000` (el puerto puede variar según la opción).

## 2. Estructura de carpetas

```
/
├── index.html      Estructura de la página y formulario (novalidate)
├── estilos.css     Estilos
├── Producto.js     Clase Producto
├── datos.js        Constantes de negocio y colecciones: catalogo, carrito, pedidos
├── calculos.js     Funciones puras de cálculo económico
├── validacion.js   Funciones puras de validación
├── catalogo.js     Búsqueda, filtro y tarjetas de producto
├── carrito.js      Operaciones del carrito y su pintado
├── formulario.js   Formulario: validación en pantalla y confirmación del pedido
├── historial.js    Creación de pedidos, historial, filtro y exportación JSON
├── main.js         Arranque y utilidades de interfaz compartidas
└── README.md
```

Orden de carga en `index.html` (con `defer`, se ejecutan en este orden): `Producto.js` → `datos.js` → `calculos.js` → `validacion.js` → `catalogo.js` → `carrito.js` → `formulario.js` → `historial.js` → `main.js`.

## 3. Funcionalidades: qué ficheros, clases y funciones intervienen

| Funcionalidad | Ficheros | Clases / funciones |
|---|---|---|
| Datos en memoria | `datos.js`, `Producto.js` | `Producto` (constructor, `hayDisponibilidad`, `descontar`), `datosProductos`, `catalogo`, `carrito`, `pedidos` |
| Catálogo | `catalogo.js` | `crearTarjetaProducto`, `renderCatalogo`, `poblarCategorias` |
| Búsqueda y filtro por categoría | `catalogo.js` | `filtrarProductos`, `obtenerCategorias` |
| Añadir al carrito | `carrito.js`, `catalogo.js`, `validacion.js` | `agregarAlCarrito`, `validarCantidad`, delegación en `iniciarCatalogo` |
| Retirar línea | `carrito.js` | `retirarDelCarrito`, delegación en `iniciarCarrito` |
| Vista del carrito | `carrito.js` | `renderCarrito`, `crearLineaCarrito` |
| Cálculos (subtotal, descuento, total) | `calculos.js` | `calcularSubtotal`, `calcularDescuento(subtotal, porcentaje = 0)`, `obtenerPorcentajeDescuento`, `calcularTotal`, `calcularResumenPedido`, `formatearImporte` |
| Validación del pedido | `validacion.js`, `formulario.js` | `validarDatosPedido`, `REGEX_CP`, `REGEX_EMAIL`, `validarFormulario`, `mostrarErrores`, `manejarEdicion` |
| Campos condicionales de envío | `formulario.js` | `actualizarCamposEntrega` |
| Contador de observaciones | `formulario.js` | `actualizarContador` |
| Comprobación de stock | `validacion.js`, `Producto.js` | `validarStockCarrito`, `Producto.hayDisponibilidad` |
| Confirmación del pedido | `formulario.js`, `historial.js` | `manejarEnvio`, `crearPedido`, `siguienteIdPedido`, `Producto.descontar` |
| Historial y detalle | `historial.js` | `renderHistorial`, `crearEntradaHistorial` |
| Filtro y resumen del historial | `historial.js`, `calculos.js` | `filtrarPedidos`, `calcularResumenPedidos` |
| Exportar JSON | `historial.js` | listener de `#btn-exportar`, `JSON.stringify` |

Decisiones de diseño relevantes:

- **Funciones puras vs. DOM.** `calcularSubtotal`, `calcularDescuento`, `validarDatosPedido` (y el resto de `calculos.js`/`validacion.js`) reciben datos y devuelven resultados; no tocan el DOM. Las funciones `render*`, `crear*` de tarjetas/líneas y `mostrar*` son las que actualizan la interfaz.
- **Una única fuente de verdad.** El carrito guarda solo `{ productoId, cantidad }`; precio y stock se consultan siempre en el catálogo.
- **Importes numéricos.** Se redondea a céntimos con `redondear2` (devuelve número) y solo se convierte a texto en `formatearImporte`.
- **Orden al confirmar.** Primero se valida todo (formulario, carrito vacío, stock) sin tocar nada; solo si todo es correcto se descuenta stock, se guarda el pedido y se vacía el carrito.
- **DOM seguro.** Se usa `createElement`, `textContent` y `append`; no se usa `innerHTML`.
- **Exportar historial** vuelca el historial completo (no solo el filtrado).
- **Botón "Confirmar pedido"** siempre habilitado: al pulsarlo con el carrito vacío se muestra el motivo.

## 4. Casos de prueba reproducibles en el navegador

Estado inicial tras cargar la página: catálogo de 8 productos, carrito vacío, historial vacío. Recarga la página (F5) para volver a este estado antes de cada bloque si lo necesitas.

Catálogo (productos): 101 Ratón USB 12,50 € (stock 8) · 102 Teclado 24,90 € (stock **0**) · 103 Monitor 24" 129,99 € (stock 3) · 104 Pendrive 64 GB 9,95 € (20) · 105 Disco SSD 1 TB 79,90 € (5) · 106 Cuaderno A5 3,20 € (50) · 107 Grapadora 7,45 € (12) · 108 Auriculares 39,90 € (2).

### T1. Catálogo
| Pasos | Resultado esperado |
|---|---|
| Cargar la página | 8 tarjetas con nombre, categoría, precio, existencias y campo de cantidad. Mensaje "Mostrando 8 de 8 productos." |
| Observar la tarjeta "Teclado" | Muestra "Agotado"; campo de cantidad y botón deshabilitados. |

### T2. Búsqueda y filtro (incluye filtro sin resultados)
| Pasos | Resultado esperado |
|---|---|
| Escribir `RATÓN` en el buscador (en mayúsculas) | Solo aparece "Ratón USB" (no distingue mayúsculas). |
| Borrar el texto; elegir categoría "Oficina" | Solo Cuaderno A5 y Grapadora. |
| Categoría "Oficina" + texto `ratón` | Ningún producto y mensaje "No se ha encontrado ningún producto con esos criterios." |

### T3. Añadir al carrito, suma de cantidades y errores de cantidad
| Pasos | Resultado esperado |
|---|---|
| Ratón USB, cantidad `2`, "Añadir" | Una línea "Ratón USB — 2 x 12,50 € — 25,00 €"; total de unidades 2. El stock del catálogo sigue siendo 8. |
| Ratón USB, cantidad `3`, "Añadir" | **Suma de cantidades**: sigue habiendo UNA línea, ahora con cantidad 5 (62,50 €). |
| **Stock insuficiente:** Monitor, cantidad `4` | Rechazado: "La cantidad supera el stock disponible (3)." El carrito no cambia. |
| Monitor `2` (se añade) y de nuevo Monitor `2` | El segundo se rechaza: "Ya tienes 2 en el carrito y solo hay 3 en stock." |
| Cantidad vacía (borrar el campo) | "Indica una cantidad." |
| Cantidad `0` y cantidad `-1` | "La cantidad debe ser mayor que cero." |
| Cantidad `1.5` | "La cantidad debe ser un número entero." |
| Corregir el valor en el campo | El mensaje de error desaparece. |
| **Producto agotado:** intentar pulsar "Añadir" en Teclado | No es posible: botón deshabilitado. |

### T4. Retirar líneas (delegación de eventos)
| Pasos | Resultado esperado |
|---|---|
| Con Ratón y Monitor en el carrito, pulsar "Retirar" en la línea del Ratón | Desaparece solo esa línea; el resumen se recalcula. |
| Pulsar "Retirar" en la última línea | Mensaje "El carrito está vacío…" y se oculta el resumen. |

### T5. Carrito vacío
| Pasos | Resultado esperado |
|---|---|
| Con el carrito vacío, rellenar el formulario correctamente y pulsar "Confirmar pedido" | No se crea pedido; mensaje "El carrito está vacío: añade al menos un producto." Los datos del formulario se conservan. |

### T6. Cálculos y umbral de 100 €
| Pasos (carrito vacío al empezar) | Resultado esperado |
|---|---|
| Ratón USB x7 | Subtotal 87,50 €; descuento 0,00 €; total 87,50 € (por debajo del umbral). |
| Añadir 1 Ratón más (8 en total) | Subtotal **100,00 €**; descuento 10,00 € (10 %); total 90,00 € (el umbral "alcanza o supera" aplica descuento). |
| Vaciar; Monitor x1 | Subtotal 129,99 €; descuento 13,00 €; total 116,99 €. |
| Vaciar; Pendrive x10 | Subtotal 99,50 €; sin descuento. |

### T7. Validación del formulario (nombre, correo, observaciones, aceptación)
Con al menos un producto en el carrito:

| Pasos | Resultado esperado |
|---|---|
| Nombre: solo espacios `"   "` y salir del campo | Error "Indica tu nombre y apellidos." (el navegador lo daría por relleno; lo detecta JavaScript). |
| Nombre: `A` | Error "entre 2 y 60 caracteres". |
| **Correo inválido:** `pepe@` / `pepe@dominio` / `pepe dominio.es` | Error "El correo electrónico no tiene un formato válido…". |
| Correo `pepe@dominio.es` | El error desaparece. |
| Escribir en Observaciones | El contador muestra `n/200` y se actualiza con cada tecla; no se puede escribir más de 200. |
| Pulsar "Confirmar pedido" sin marcar la casilla | Error "Debes confirmar que los datos del pedido son correctos."; no se crea pedido. |

### T8. Cambio de modalidad y código postal inválido
| Pasos | Resultado esperado |
|---|---|
| Por defecto: Recogida | No se ven campos de dirección ni código postal. |
| Elegir Envío | Aparecen Dirección y Código postal. |
| **Código postal inválido:** probar `1234`, `00123`, `53000`, `41A01`, `4100` | Todos dan error "Código postal no válido: 5 cifras y provincia entre 01 y 52." |
| Código postal válido: `41001`, `01001`, `52001` | Sin error. |
| Dirección `abc` | Error "entre 5 y 100 caracteres". |
| Con errores de dirección/CP visibles, cambiar a Recogida | Los campos se ocultan y desaparecen sus errores. |
| Confirmar un pedido válido con Recogida | Se crea el pedido sin pedir datos postales. |

### T9. Confirmación del pedido (stock, carrito, historial)
| Pasos | Resultado esperado |
|---|---|
| Añadir Ratón x3; rellenar el formulario (Recogida, aceptación marcada); confirmar | Mensaje "Pedido #1 confirmado…". Carrito vacío; el stock de Ratón pasa de 8 a 5; el formulario se vacía; aparece en el historial. |
| Confirmar con un dato inválido (p. ej. correo erróneo) | No cambia nada (ni stock, ni carrito, ni historial) y los datos escritos se conservan. |
| **Stock insuficiente al confirmar:** añadir Monitor x2; en DevTools → Consola ejecutar `catalogo.find(p => p.id === 103).stock = 1`; confirmar | Error "Stock insuficiente de "Monitor 24"": pides 2 y quedan 1." No se crea el pedido ni se modifica el stock. |

### T10. Historial, filtro y detalle
Crear dos pedidos (uno con Recogida y otro con Envío, p. ej. 87,50 € y 116,99 €):

| Pasos | Resultado esperado |
|---|---|
| Ver el historial | Dos entradas con número, fecha, nombre, modalidad y total. "Pedidos: 2 · Suma de importes: 204,49 €". |
| Pulsar sobre una entrada | Se despliega el detalle: líneas con nombre, cantidad, precio de ese momento e importe, subtotal, descuento y total. |
| Filtro "Recogida" / "Envío" | Solo los de esa modalidad; el recuento y la suma se calculan sobre los filtrados. |
| Sin pedidos de una modalidad (p. ej. recargar y crear solo uno de recogida; filtro "Envío") | "Ningún pedido cumple el filtro seleccionado." y "Pedidos: 0 · Suma de importes: 0,00 €" (sin NaN). |
| Recargar la página (historial vacío) | "Todavía no hay pedidos confirmados." |
| Cambiar el stock tras un pedido (nuevo pedido del mismo producto) | Las líneas del pedido antiguo siguen mostrando nombre y precio de su momento. |

### T11. Exportar historial (JSON)
| Pasos | Resultado esperado |
|---|---|
| Con pedidos, pulsar "Exportar historial" | Aparece un textarea con el JSON (`id`, `fecha`, `cliente`, `entrega`, `lineas`, `subtotal`, `descuento`, `total`), seleccionado y listo para copiar. |
| Sin pedidos, pulsar "Exportar historial" | El textarea muestra `[]`. |

## 5. Evidencia de depuración con punto de interrupción

![Depuración en calculos.js](docs/capturas/Captura_A_adirAlPedido2.PNG)

**Qué se hizo.** Con DevTools abierto (pestaña *Sources*), se puso un punto de interrupción en la línea 18 de `js/logica/calculos.js`, dentro de `calcularSubtotal`:

`suma += producto.precio * linea.cantidad;`

Después se pulsó "Añadir al carrito" con 1 unidad de Ratón USB. Al repintar el carrito se llama a `calcularResumenPedido`, que llama a `calcularSubtotal`, y la ejecución se detuvo (*Debugger paused*).

**Qué se observó.**
- En el panel *Scope → Local*, `carrito` contiene una línea (`{productoId: 101, cantidad: 1}`) y `catalogo` tiene 8 productos.
- Avanzando paso a paso, la variable `suma` pasó de `0` a `12.5`, es decir, `precio (12,50 €) × cantidad (1)`. En la captura, la ejecución está parada en la línea 21 (`return redondear2(suma)`) con `suma = 12.5`.
- En *Call Stack* aparece `calcularSubtotal` en `calculos.js:21`, lo que confirma qué función se está ejecutando y que la llamó el cálculo del resumen del carrito.

**Qué se comprobó.** Que el subtotal se acumula correctamente línea a línea y que el valor que se devuelve (12,5) coincide con el importe que se muestra después en el carrito. Si el cálculo fallara, este punto permite ver en qué iteración `suma` toma un valor incorrecto.

## 6. Evidencia en la pestaña Network

![Pestaña Network](docs/capturas/Captura_Pesta_aNetwork.PNG)

**Qué se hizo.** Con DevTools abierto en la pestaña *Network* y la opción *Disable cache* activada, se recargó la página servida con Live Server en `http://127.0.0.1:5500/index.html`.

**Qué se observó.**
- Se realizaron 13 peticiones (48,3 kB transferidos). `DOMContentLoaded` se produjo a los 59 ms.
- `index.html` (tipo *document*), `css/estilos.css` (tipo *stylesheet*) y los 9 ficheros JavaScript (tipo *script*) respondieron con **estado 200**, por lo que se cargaron correctamente por HTTP y no por `file://`.
- La columna *Initiator* indica que los scripts se piden desde `index.html:151` a `index.html:159`, en el mismo orden en que se declaran las etiquetas `<script defer>`: `Producto.js`, `datos.js`, `calculos.js`, `validacion.js`, `catalogo.js`, `carrito.js`, `formulario.js`, `historial.js` y `main.js`.
- La entrada `ws` (estado 101) es la conexión WebSocket que usa Live Server para recargar la página automáticamente. No forma parte de la aplicación.
- `favicon.ico` devuelve 404: el navegador pide ese icono de la pestaña de forma automática y el proyecto no incluye ninguno. No afecta al funcionamiento.

**Qué se comprobó.** Que todos los recursos de la aplicación se sirven correctamente desde el servidor local y que el orden de carga es el esperado.