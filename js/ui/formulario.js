"use strict";

/*
 * formulario.js
 * -------------
 * Conecta el formulario con la validación (validacion.js) y con la creación
 * del pedido (historial.js). Usa la Constraint Validation API:
 *   setCustomValidity(msg)  -> marca el control como inválido con ese mensaje
 *   setCustomValidity("")   -> lo marca como válido (borra el error personalizado)
 *   validity / validationMessage / checkValidity() / reportValidity()
 */

const CAMPOS_FORMULARIO = ["nombre", "email", "entrega", "direccion", "cp", "observaciones", "aceptacion"];
const MAX_OBSERVACIONES = 200;

// El control sobre el que se guarda el error de cada campo.
// Los radios comparten nombre; el error del grupo se asocia al primero.
function obtenerControl(form, campo) {
  if (campo === "entrega") {
    return form.querySelector("#entrega-recogida");
  }
  return form.elements[campo];
}

// FormData reúne los valores de los controles que se enviarían. Los controles
// deshabilitados NO entran: si la entrega es "recogida", dirección y CP no aparecen.
// Un checkbox solo aparece si está marcado, por eso usamos has().
function leerDatosFormulario(form) {
  const formData = new FormData(form);
  return {
    nombre: String(formData.get("nombre") ?? ""),
    email: String(formData.get("email") ?? ""),
    entrega: String(formData.get("entrega") ?? ""),
    direccion: String(formData.get("direccion") ?? ""),
    cp: String(formData.get("cp") ?? ""),
    observaciones: String(formData.get("observaciones") ?? ""),
    aceptacion: formData.has("aceptacion")
  };
}

// Ejecuta la validación completa y la vuelca en los controles.
// Primero se pone cada campo a "válido" y luego se marcan solo los que fallan:
// así los errores de campos ya corregidos desaparecen solos.
function validarFormulario(form) {
  const datos = leerDatosFormulario(form);
  const { errores } = validarDatosPedido(datos);
  CAMPOS_FORMULARIO.forEach((campo) => {
    obtenerControl(form, campo).setCustomValidity(errores[campo] ?? "");
  });
  return datos;
}

// Muestra junto a cada campo su mensaje de error (o lo borra si no hay).
// Los controles deshabilitados (willValidate === false) nunca muestran error.
function mostrarErrores(form, campos) {
  campos.forEach((campo) => {
    const control = obtenerControl(form, campo);
    const zona = document.getElementById(`error-${campo}`);
    const hayError = control.willValidate && !control.validity.valid;
    zona.textContent = hayError ? control.validationMessage : "";
    control.setAttribute("aria-invalid", hayError ? "true" : "false");
  });
}

function limpiarErrorCampo(form, campo) {
  obtenerControl(form, campo).setCustomValidity("");
  document.getElementById(`error-${campo}`).textContent = "";
  obtenerControl(form, campo).setAttribute("aria-invalid", "false");
}

function actualizarContador(form) {
  const longitud = form.elements.observaciones.value.length;
  document.getElementById("contador-observaciones").textContent = `${longitud}/${MAX_OBSERVACIONES}`;
}

// Muestra/oculta y habilita/deshabilita los campos postales según la modalidad.
function actualizarCamposEntrega(form) {
  const esEnvio = form.elements.entrega.value === "envio";
  const grupo = document.getElementById("datos-envio");
  grupo.disabled = !esEnvio; // deshabilitado => no se valida y no entra en FormData
  grupo.hidden = !esEnvio;
  if (!esEnvio) {
    // Al pasar a "recogida" no debe quedar ningún error personalizado de envío.
    limpiarErrorCampo(form, "direccion");
    limpiarErrorCampo(form, "cp");
  }
}

// Reacciona a "input" y "change" (los dos burbujean hasta el <form>).
function manejarEdicion(event) {
  const form = event.currentTarget;
  const campo = event.target.name;
  if (!CAMPOS_FORMULARIO.includes(campo)) {
    return;
  }
  if (campo === "entrega" && event.type === "change") {
    actualizarCamposEntrega(form);
  }
  if (campo === "observaciones") {
    actualizarContador(form);
  }
  validarFormulario(form);
  mostrarErrores(form, [campo]); // solo el campo que se está editando
}

function manejarEnvio(event) {
  event.preventDefault(); // evita que el navegador recargue la página
  const form = event.currentTarget;
  const mensaje = document.getElementById("mensaje-formulario");
  mostrarMensaje(mensaje, "");

  // 1) Validación completa SIEMPRE, aunque se haya validado mientras se escribía.
  const datos = validarFormulario(form);
  mostrarErrores(form, CAMPOS_FORMULARIO);
  const formularioValido = form.checkValidity();

  // 2) Se reúnen TODOS los problemas antes de decidir. Todavía no se ha
  //    modificado ninguna colección.
  const problemas = [];
  if (carrito.length === 0) {
    problemas.push("El carrito está vacío: añade al menos un producto.");
  }
  validarStockCarrito(carrito, catalogo).forEach((problema) => problemas.push(problema));
  if (!formularioValido) {
    problemas.push("Revisa los campos del formulario marcados con error.");
  }

  if (problemas.length > 0) {
    mostrarMensaje(mensaje, problemas.join(" "), true);
    if (!formularioValido) {
      form.reportValidity(); // lleva el foco al primer campo inválido
    }
    return; // los datos escritos en el formulario NO se pierden
  }

  // 3) Todo correcto: ahora sí se modifican las colecciones.
  const id = siguienteIdPedido(pedidos);
  const pedido = crearPedido(id, datos, carrito, catalogo);

  carrito.forEach((linea) => {
    const producto = catalogo.find((p) => p.id === linea.productoId);
    producto.descontar(linea.cantidad);
  });
  pedidos.push(pedido);
  carrito.splice(0, carrito.length); // vaciar el carrito conservando el mismo array (es const)

  // 4) Dejar el formulario y las vistas listos para el siguiente pedido.
  form.reset();
  actualizarCamposEntrega(form);
  actualizarContador(form);
  CAMPOS_FORMULARIO.forEach((campo) => limpiarErrorCampo(form, campo));
  actualizarVistas();
  mostrarMensaje(mensaje, `Pedido #${id} confirmado. Total: ${formatearImporte(pedido.total)}.`, false);
}

function iniciarFormulario() {
  const form = document.getElementById("form-pedido");
  form.addEventListener("submit", manejarEnvio);
  form.addEventListener("input", manejarEdicion);
  form.addEventListener("change", manejarEdicion);
  actualizarCamposEntrega(form);
  actualizarContador(form);
}