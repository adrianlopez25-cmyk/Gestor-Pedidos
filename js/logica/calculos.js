"use strict";
/*
 * Funciones: reciben datos por parámetros y devuelven un resultado.
 * Los importes los manejo SIEMPRE como números. Solo los convierto a texto
 * en formatearImporte(), justo para mostrarlos.
 */

// Redondeo a 2 decimales y devuelvo un NÚMERO, para evitar el problema de los decimales binarios.
function redondear2(valor) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}
// Subtotal =suma de (precio * cantidad) en cada linea dl carrito
function calcularSubtotal(carrito, catalogo) {
  let suma = 0;
  carrito.forEach((linea) => {
    const producto = catalogo.find((p) => p.id === linea.productoId);
    if (producto) {
      suma += producto.precio * linea.cantidad;
    }
  });
  return redondear2(suma);
}

// Realizo el % de descuento si el precio total es >=100 y si no hay porcentaje no aplico descuento
function obtenerPorcentajeDescuento(subtotal) {
  return subtotal >= UMBRAL_DESCUENTO ? PORCENTAJE_DESCUENTO : 0;
}

// Devuelvo el Importe de descuento en euros.
function calcularDescuento(subtotal, porcentaje = 0) {
  if (!Number.isFinite(subtotal) || !Number.isFinite(porcentaje)) {
    return 0;
  }
  if (subtotal <= 0 || porcentaje <= 0) {
    return 0;
  }
  return redondear2((subtotal * porcentaje) / 100);
}

function calcularTotal(subtotal, descuento) {
  return redondear2(subtotal - descuento);
}

function calcularTotalUnidades(carrito) {
  return carrito.reduce((acumulado, linea) => acumulado + linea.cantidad, 0);
}

//Realizo todos los calculos de un mismo pedido en un unico objeto
function calcularResumenPedido(carrito, catalogo) {
  const subtotal = calcularSubtotal(carrito, catalogo);
  const porcentaje = obtenerPorcentajeDescuento(subtotal);
  const descuento = calcularDescuento(subtotal, porcentaje);
  return {
    unidades: calcularTotalUnidades(carrito),
    subtotal,
    porcentaje,
    descuento,
    total: calcularTotal(subtotal, descuento)
  };
}

//Resumen del historial
function calcularResumenPedidos(listaPedidos) {
  const suma = listaPedidos.reduce((acumulado, pedido) => acumulado + pedido.total, 0);
  return { cantidad: listaPedidos.length, importe: redondear2(suma) };
}

// Unica funcion que convierte un numero en texto para poder mostrarlo en euros y con dos decimales.
function formatearImporte(valor) {
  const numero = Number.isFinite(valor) ? valor : 0;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(numero);
}
