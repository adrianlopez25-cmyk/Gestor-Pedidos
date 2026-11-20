"use strict";

class Producto {
  constructor(id, nombre, categoria, precio, stock) {
    // Validamos al construir: es mejor fallar pronto con un error claro que
    // arrastrar un producto corrupto (precio NaN, stock negativo...) por toda la app.
    if (!Number.isInteger(id)) {
      throw new TypeError("El id del producto debe ser un entero.");
    }
    if (typeof nombre !== "string" || nombre.trim() === "") {
      throw new TypeError("El nombre del producto es obligatorio.");
    }
    if (typeof categoria !== "string" || categoria.trim() === "") {
      throw new TypeError("La categoría del producto es obligatoria.");
    }
    if (!Number.isFinite(precio) || precio <= 0) {
      throw new RangeError("El precio debe ser un número finito mayor que cero.");
    }
    if (!Number.isInteger(stock) || stock < 0) {
      throw new RangeError("El stock debe ser un entero no negativo.");
    }

    this.id = id;
    this.nombre = nombre;
    this.categoria = categoria;
    this.precio = precio;
    this.stock = stock;
  }

  // Solo devuelve true/false: no modifica nada.
  hayDisponibilidad(cantidad) {
    return Number.isInteger(cantidad) && cantidad > 0 && cantidad <= this.stock;
  }

  // descuenta la cantidad tras una compra.

  descontar(cantidad) {
    if (!this.hayDisponibilidad(cantidad)) {
      return false;
    }
    this.stock -= cantidad;
    return true;
  }
}