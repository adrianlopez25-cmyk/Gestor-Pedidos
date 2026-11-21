"use strict";

function etiquetaCategoria(categoria) {
  return ETIQUETAS_CATEGORIA[categoria] ?? categoria;
}

// Lista de categorías distintas del catálogo (para rellenar el <select>
// y para comprobar que el valor elegido es una categoría real).
function obtenerCategorias(catalogo) {
  const categorias = [];
  catalogo.forEach((producto) => {
    if (!categorias.includes(producto.categoria)) {
      categorias.push(producto.categoria);
    }
  });
  return categorias;
}

// filter(): devuelve un array NUEVO solo con los productos que cumplen
// los dos criterios a la vez (nombre Y categoría). El original no se toca.
function filtrarProductos(catalogo, texto, categoria) {
  const busqueda = String(texto).trim().toLowerCase();
  // No confiamos en el valor del select: si no es una categoría conocida, se ignora.
  const categoriaValida = obtenerCategorias(catalogo).includes(categoria) ? categoria : "";

  return catalogo.filter((producto) => {
    const coincideNombre = busqueda === "" || producto.nombre.toLowerCase().includes(busqueda);
    const coincideCategoria = categoriaValida === "" || producto.categoria === categoriaValida;
    return coincideNombre && coincideCategoria;
  });
}

// ---------- DOM ----------

// Crea UNA tarjeta. Solo se usa createElement + textContent (nunca innerHTML),
// así ningún texto se interpreta como HTML (evita inyección de código).
function crearTarjetaProducto(producto) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta";
  tarjeta.dataset.id = String(producto.id);

  const titulo = document.createElement("h3");
  titulo.textContent = producto.nombre;

  const categoria = document.createElement("p");
  categoria.textContent = `Categoría: ${etiquetaCategoria(producto.categoria)}`;

  const precio = document.createElement("p");
  precio.textContent = `Precio: ${formatearImporte(producto.precio)}`;

  const existencias = document.createElement("p");
  const agotado = producto.stock === 0;
  existencias.textContent = agotado ? "Agotado" : `Existencias: ${producto.stock}`;
  if (agotado) {
    existencias.classList.add("agotado");
  }

  const idInput = `cantidad-${producto.id}`;
  const etiqueta = document.createElement("label");
  etiqueta.htmlFor = idInput;
  etiqueta.textContent = "Cantidad";

  const entrada = document.createElement("input");
  entrada.type = "number";
  entrada.id = idInput;
  entrada.required = true;
  entrada.min = "1";
  entrada.step = "1";
  entrada.value = "1";
  if (agotado) {
    entrada.disabled = true; // sin stock: no se puede ni escribir cantidad
  } else {
    entrada.max = String(producto.stock);
  }

  // El botón NO tiene listener propio: el contenedor #catalogo lo gestiona
  // (delegación de eventos). Solo guardamos en data-* qué producto es.
  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = "Añadir al carrito";
  boton.dataset.accion = "agregar";
  boton.dataset.id = String(producto.id);
  boton.disabled = agotado;

  const mensaje = document.createElement("p");
  mensaje.className = "mensaje-tarjeta";
  mensaje.setAttribute("role", "status");

  tarjeta.append(titulo, categoria, precio, existencias, etiqueta, entrada, boton, mensaje);
  return tarjeta;
}

// Vuelve a pintar el catálogo aplicando los filtros actuales.
function renderCatalogo() {
  const contenedor = document.getElementById("catalogo");
  const mensaje = document.getElementById("mensaje-catalogo");
  const texto = document.getElementById("buscador").value;
  const categoria = document.getElementById("filtro-categoria").value;

  const resultado = filtrarProductos(catalogo, texto, categoria);

  contenedor.replaceChildren(); // vacía el contenedor
  if (resultado.length === 0) {
    mensaje.textContent = "No se ha encontrado ningún producto con esos criterios.";
    return;
  }
  mensaje.textContent = `Mostrando ${resultado.length} de ${catalogo.length} productos.`;
  resultado.forEach((producto) => contenedor.append(crearTarjetaProducto(producto)));
}

function poblarCategorias() {
  const select = document.getElementById("filtro-categoria");
  obtenerCategorias(catalogo).forEach((categoria) => {
    const opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = etiquetaCategoria(categoria);
    select.append(opcion);
  });
}

function iniciarCatalogo() {
  poblarCategorias();

  document.getElementById("buscador").addEventListener("input", () => renderCatalogo());
  document.getElementById("filtro-categoria").addEventListener("change", () => renderCatalogo());

  const contenedor = document.getElementById("catalogo");

  // DELEGACIÓN: un solo listener en el padre atiende a todos los botones,
  // incluidos los que se creen en el futuro. event.target es el elemento
  // exacto pulsado; closest() sube hasta encontrar el botón que nos interesa.
  contenedor.addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-accion='agregar']");
    if (!boton) {
      return; // el clic fue en otra parte de la tarjeta
    }
    const tarjeta = boton.closest(".tarjeta");
    const entrada = tarjeta.querySelector("input[type='number']");
    const mensaje = tarjeta.querySelector(".mensaje-tarjeta");

    // data-id es TEXTO: conversión explícita a número.
    // valueAsNumber da NaN si el campo está vacío (Number("") sería 0: trampa).
    const resultado = agregarAlCarrito(Number(boton.dataset.id), entrada.valueAsNumber);

    // Constraint Validation API: marcamos el campo como inválido con nuestro mensaje.
    entrada.setCustomValidity(resultado.ok ? "" : resultado.mensaje);
    mostrarMensaje(mensaje, resultado.mensaje, !resultado.ok);

    if (resultado.ok) {
      renderCarrito();
    }
  });

  // Al corregir la cantidad se borra el error personalizado (si no, el campo
  // seguiría inválido para siempre).
  contenedor.addEventListener("input", (event) => {
    if (event.target.matches("input[type='number']")) {
      event.target.setCustomValidity("");
      const mensaje = event.target.closest(".tarjeta").querySelector(".mensaje-tarjeta");
      mostrarMensaje(mensaje, "");
    }
  });
}