"use strict";


// Escribe un mensaje en un elemento y le pone clase "error" u "ok".
// Se usa textContent (nunca innerHTML) para que el texto no se interprete como HTML.
function mostrarMensaje(elemento, texto, esError = false) {
  elemento.textContent = texto;
  elemento.classList.toggle("error", texto !== "" && esError);
  elemento.classList.toggle("ok", texto !== "" && !esError);
}

// Repinta las tres vistas. Se llama tras confirmar un pedido, que es lo único
// que cambia catálogo (stock), carrito (vacío) e historial a la vez.
function actualizarVistas() {
  renderCatalogo();
  renderCarrito();
  renderHistorial();
}

function iniciar() {
  iniciarCatalogo();
  iniciarCarrito();
  iniciarFormulario();
  iniciarHistorial();
  actualizarVistas();
}

iniciar();