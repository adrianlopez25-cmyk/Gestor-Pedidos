"use strict";

/*
 * carrito.js
 * ----------
 * Operaciones sobre el carrito (lógica) y su pintado (DOM).
 * Regla clave: añadir al carrito NO descuenta stock. El stock solo cambia
 * al confirmar un pedido (formulario.js).
 */

// ---------- LÓGICA ----------

// Añade `cantidad` unidades del producto. Devuelve { ok, mensaje } para que
// quien la llame decida cómo mostrarlo (esta función no toca el DOM).
function agregarAlCarrito(productoId, cantidad) {
  const producto = catalogo.find((p) => p.id === productoId);
  if (!producto) {
    return { ok: false, mensaje: "El producto no existe." };
  }

  const errorCantidad = validarCantidad(cantidad, producto.stock);
  if (errorCantidad !== "") {
    return { ok: false, mensaje: errorCantidad };
  }

  // Una única línea por producto: buscamos si ya existe.
  const linea = carrito.find((l) => l.productoId === productoId);
  const cantidadFinal = (linea ? linea.cantidad : 0) + cantidad;

  // Se valida la cantidad TOTAL (lo que ya había + lo nuevo), no solo la nueva;
  // si no, se podría superar el stock sumando en varias veces.
  if (!producto.hayDisponibilidad(cantidadFinal)) {
    const yaEnCarrito = linea ? linea.cantidad : 0;
    return {
      ok: false,
      mensaje: `Ya tienes ${yaEnCarrito} en el carrito y solo hay ${producto.stock} en stock.`
    };
  }

  if (linea) {
    linea.cantidad = cantidadFinal; // suma de cantidades, sin línea duplicada
  } else {
    carrito.push({ productoId, cantidad });
  }
  return { ok: true, mensaje: `Añadido: ${cantidad} x ${producto.nombre}.` };
}

// Retira la línea completa del producto. splice(índice, 1) elimina 1 elemento
// MODIFICANDO el array original.
function retirarDelCarrito(productoId) {
  const indice = carrito.findIndex((l) => l.productoId === productoId);
  if (indice === -1) {
    return false;
  }
  carrito.splice(indice, 1);
  return true;
}

// ---------- DOM ----------

function crearLineaCarrito(linea) {
  const producto = catalogo.find((p) => p.id === linea.productoId);

  const elemento = document.createElement("li");
  elemento.className = "linea";

  const nombre = document.createElement("span");
  nombre.className = "linea-nombre";
  nombre.textContent = producto.nombre;

  const detalle = document.createElement("span");
  detalle.textContent = `${linea.cantidad} x ${formatearImporte(producto.precio)}`;

  const subtotal = document.createElement("span");
  subtotal.className = "linea-subtotal";
  subtotal.textContent = formatearImporte(redondear2(producto.precio * linea.cantidad));

  const boton = document.createElement("button");
  boton.type = "button";
  boton.textContent = "Retirar";
  boton.dataset.accion = "retirar";
  boton.dataset.id = String(linea.productoId);
  boton.setAttribute("aria-label", `Retirar ${producto.nombre} del carrito`);

  elemento.append(nombre, detalle, subtotal, boton);
  return elemento;
}

function renderCarrito() {
  const lista = document.getElementById("lineas-carrito");
  const vacio = document.getElementById("carrito-vacio");
  const resumenDom = document.getElementById("resumen-carrito");

  lista.replaceChildren();

  if (carrito.length === 0) {
    vacio.textContent = "El carrito está vacío. Añade productos desde el catálogo.";
    resumenDom.hidden = true;
    return;
  }

  vacio.textContent = "";
  carrito.forEach((linea) => lista.append(crearLineaCarrito(linea)));

  // Los números los calcula la lógica pura; aquí solo se muestran.
  const resumen = calcularResumenPedido(carrito, catalogo);
  document.getElementById("total-unidades").textContent = String(resumen.unidades);
  document.getElementById("subtotal").textContent = formatearImporte(resumen.subtotal);
  document.getElementById("descuento").textContent =
    resumen.porcentaje > 0
      ? `-${formatearImporte(resumen.descuento)} (${resumen.porcentaje} %)`
      : formatearImporte(0);
  document.getElementById("total-pedido").textContent = formatearImporte(resumen.total);
  resumenDom.hidden = false;
}

function iniciarCarrito() {
  // Delegación de eventos: UN listener en el <ul> común para todos los
  // botones "Retirar", aunque las líneas se creen y destruyan continuamente.
  document.getElementById("lineas-carrito").addEventListener("click", (event) => {
    const boton = event.target.closest("button[data-accion='retirar']");
    if (!boton) {
      return;
    }
    retirarDelCarrito(Number(boton.dataset.id));
    renderCarrito();
  });
}