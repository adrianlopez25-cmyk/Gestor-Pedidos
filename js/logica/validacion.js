"use strict";

/*
 * Validación como funciones PURAS (sin DOM). Reciben datos y devuelven
 * los errores encontrados. La parte que muestra los errores en pantalla
 * está en formulario.js.
 */

// Código postal español: 5 cifras y provincia (2 primeras cifras) entre 01 y 52.

const REGEX_CP = /^(0[1-9]|[1-4][0-9]|5[0-2])[0-9]{3}$/;

// Solo comprueba el FORMATO; no demuestra que la dirección exista.
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Convierte cualquier valor a texto sin espacios exteriores (null/undefined -> "").
function limpiarTexto(valor) {
  return String(valor ?? "").trim();
}

// Valida los datos del formulario { nombre, email, entrega, direccion, cp, observaciones, aceptacion }
// y devuelve { valido: boolean, errores: { campo: "mensaje" } }.
function validarDatosPedido(datos) {
  const errores = {};

  const nombre = limpiarTexto(datos.nombre);
  if (nombre.length === 0) {
    errores.nombre = "Indica tu nombre y apellidos.";
  } else if (nombre.length < 2 || nombre.length > 60) {
    errores.nombre = "El nombre debe tener entre 2 y 60 caracteres.";
  }

  const email = limpiarTexto(datos.email);
  if (email.length === 0) {
    errores.email = "Indica tu correo electrónico.";
  } else if (email.length > 254 || !REGEX_EMAIL.test(email)) {
    errores.email = "El correo electrónico no tiene un formato válido (ejemplo: nombre@dominio.es).";
  }

  // No nos fiamos de que el radio solo pueda tener dos valores: se comprueba.
  if (!MODALIDADES.includes(datos.entrega)) {
    errores.entrega = "Elige una modalidad de entrega válida: recogida o envío.";
  }

  // Los datos postales solo se exigen si la entrega es "envio".
  if (datos.entrega === "envio") {
    const direccion = limpiarTexto(datos.direccion);
    if (direccion.length === 0) {
      errores.direccion = "Indica la dirección de envío.";
    } else if (direccion.length < 5 || direccion.length > 100) {
      errores.direccion = "La dirección debe tener entre 5 y 100 caracteres.";
    }

    const cp = limpiarTexto(datos.cp);
    if (cp.length === 0) {
      errores.cp = "Indica el código postal.";
    } else if (!REGEX_CP.test(cp)) {
      errores.cp = "Código postal no válido: 5 cifras y provincia entre 01 y 52.";
    }
  }

  if (String(datos.observaciones ?? "").length > 200) {
    errores.observaciones = "Las observaciones no pueden superar los 200 caracteres.";
  }

  if (datos.aceptacion !== true) {
    errores.aceptacion = "Debes confirmar que los datos del pedido son correctos.";
  }

  return { valido: Object.keys(errores).length === 0, errores };
}

// Valida una cantidad (número) frente al stock. Devuelve "" si es válida o el
// mensaje de error. Recibe un NÚMERO (input.valueAsNumber): un campo vacío llega
// como NaN, así que nunca se confunde con 0.
function validarCantidad(cantidad, stock) {
  if (Number.isNaN(cantidad)) {
    return "Indica una cantidad.";
  }
  if (!Number.isInteger(cantidad)) {
    return "La cantidad debe ser un número entero.";
  }
  if (cantidad <= 0) {
    return "La cantidad debe ser mayor que cero.";
  }
  if (cantidad > stock) {
    return `La cantidad supera el stock disponible (${stock}).`;
  }
  return "";
}

// Comprueba el stock de TODAS las líneas del carrito contra el catálogo.
// Devuelve una lista de problemas (vacía si todo está bien).
function validarStockCarrito(carrito, catalogo) {
  const problemas = [];
  carrito.forEach((linea) => {
    const producto = catalogo.find((p) => p.id === linea.productoId);
    if (!producto) {
      problemas.push(`El producto ${linea.productoId} ya no existe en el catálogo.`);
    } else if (!producto.hayDisponibilidad(linea.cantidad)) {
      problemas.push(
        `Stock insuficiente de "${producto.nombre}": pides ${linea.cantidad} y quedan ${producto.stock}.`
      );
    }
  });
  return problemas;
}