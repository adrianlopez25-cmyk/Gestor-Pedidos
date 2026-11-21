"use strict";

/*
 * historial.js
 * ------------
 * Creación de pedidos, filtrado del historial, pintado y exportación a JSON.
 */

// ---------- LÓGICA ----------

// Id único: el mayor existente + 1 (no depende de la posición en el array).
function siguienteIdPedido(listaPedidos) {
  return listaPedidos.reduce((maximo, pedido) => Math.max(maximo, pedido.id), 0) + 1;
}

// Construye el objeto pedido. Guarda COPIAS de nombre y precio de cada línea
// ("foto" del momento): si luego cambia el catálogo, el historial no cambia.
// `fecha = new Date()` es un parámetro por defecto (útil también para pruebas).
function crearPedido(id, datos, carrito, catalogo, fecha = new Date()) {
  const lineas = carrito.map((linea) => {
    const producto = catalogo.find((p) => p.id === linea.productoId);
    return {
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: linea.cantidad,
      importe: redondear2(producto.precio * linea.cantidad)
    };
  });

  const resumen = calcularResumenPedido(carrito, catalogo);

  const cliente = {
    nombre: limpiarTexto(datos.nombre),
    email: limpiarTexto(datos.email),
    observaciones: limpiarTexto(datos.observaciones)
  };
  if (datos.entrega === "envio") {
    cliente.direccion = limpiarTexto(datos.direccion);
    cliente.cp = limpiarTexto(datos.cp);
  }

  return {
    id,
    fecha: fecha.toISOString(),
    cliente,
    entrega: datos.entrega,
    lineas,
    unidades: resumen.unidades,
    subtotal: resumen.subtotal,
    descuento: resumen.descuento,
    total: resumen.total
  };
}

function filtrarPedidos(listaPedidos, modalidad) {
  if (!MODALIDADES.includes(modalidad)) {
    return listaPedidos.slice(); // "todos" (o valor no válido): copia completa
  }
  return listaPedidos.filter((pedido) => pedido.entrega === modalidad);
}

// ---------- DOM ----------

function crearEntradaHistorial(pedido) {
  // <details>/<summary> permite desplegar el detalle sin escribir JavaScript.
  const detalles = document.createElement("details");
  detalles.className = "pedido";

  const resumen = document.createElement("summary");
  const fecha = new Date(pedido.fecha).toLocaleString("es-ES");
  const modalidad = pedido.entrega === "envio" ? "Envío" : "Recogida";
  resumen.textContent =
    `Pedido #${pedido.id} · ${fecha} · ${pedido.cliente.nombre} · ${modalidad} · ${formatearImporte(pedido.total)}`;

  const lista = document.createElement("ul");
  pedido.lineas.forEach((linea) => {
    const item = document.createElement("li");
    item.textContent =
      `${linea.nombre}: ${linea.cantidad} x ${formatearImporte(linea.precio)} = ${formatearImporte(linea.importe)}`;
    lista.append(item);
  });

  const importes = document.createElement("p");
  importes.textContent =
    `Subtotal: ${formatearImporte(pedido.subtotal)} · Descuento: ${formatearImporte(pedido.descuento)} · Total: ${formatearImporte(pedido.total)}`;

  detalles.append(resumen, lista, importes);
  return detalles;
}

function renderHistorial() {
  const contenedor = document.getElementById("lista-historial");
  const mensaje = document.getElementById("mensaje-historial");
  const resumenDom = document.getElementById("resumen-historial");

  const filtro = document.getElementById("filtro-entrega").value;
  const filtrados = filtrarPedidos(pedidos, filtro);
  // El resumen se calcula sobre los pedidos YA filtrados.
  const resumen = calcularResumenPedidos(filtrados);

  resumenDom.textContent =
    `Pedidos: ${resumen.cantidad} · Suma de importes: ${formatearImporte(resumen.importe)}`;

  contenedor.replaceChildren();
  if (pedidos.length === 0) {
    mensaje.textContent = "Todavía no hay pedidos confirmados.";
  } else if (filtrados.length === 0) {
    mensaje.textContent = "Ningún pedido cumple el filtro seleccionado.";
  } else {
    mensaje.textContent = "";
    filtrados.forEach((pedido) => contenedor.append(crearEntradaHistorial(pedido)));
  }
}

function iniciarHistorial() {
  document.getElementById("filtro-entrega").addEventListener("change", () => renderHistorial());

  document.getElementById("btn-exportar").addEventListener("click", () => {
    const zona = document.getElementById("zona-exportacion");
    const salida = document.getElementById("salida-json");
    // JSON.stringify(valor, null, 2): convierte los datos a texto JSON con sangría de 2 espacios.
    salida.value = JSON.stringify(pedidos, null, 2);
    zona.hidden = false;
    salida.focus();
    salida.select(); // deja el texto seleccionado, listo para copiar
  });
}