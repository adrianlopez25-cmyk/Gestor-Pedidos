"use strict";

/*
 * Empleo `const` para impedir REASIGNAR la variable, pero
 * el array sigue siendo modificable. Así garantizo que
 * todos los ficheros trabajan siempre sobre el MISMO array.
 */

// Constantes de negocio.
const UMBRAL_DESCUENTO = 100;      // euros de subtotal a partir de los que hay descuento
const PORCENTAJE_DESCUENTO = 10;   // % de descuento
const MODALIDADES = ["recogida", "envio"]; // únicas opciones válidas de entrega

const ETIQUETAS_CATEGORIA = {
  perifericos: "Periféricos",
  almacenamiento: "Almacenamiento",
  oficina: "Oficina"
};

// Objetos literales. Luego se convierten en instancias de Producto.
const datosProductos = [
  { id: 101, nombre: "Ratón USB", categoria: "perifericos", precio: 12.5, stock: 8 },
  { id: 102, nombre: "Teclado", categoria: "perifericos", precio: 24.9, stock: 0 },
  { id: 103, nombre: "Monitor 24\"", categoria: "perifericos", precio: 129.99, stock: 3 },
  { id: 104, nombre: "Pendrive 64 GB", categoria: "almacenamiento", precio: 9.95, stock: 20 },
  { id: 105, nombre: "Disco SSD 1 TB", categoria: "almacenamiento", precio: 79.9, stock: 5 },
  { id: 106, nombre: "Cuaderno A5", categoria: "oficina", precio: 3.2, stock: 50 },
  { id: 107, nombre: "Grapadora", categoria: "oficina", precio: 7.45, stock: 12 },
  { id: 108, nombre: "Auriculares", categoria: "perifericos", precio: 39.9, stock: 2 }
];

// map(): transforma cada objeto literal en una instancia de la clase Producto.
const catalogo = datosProductos.map(
  (dato) => new Producto(dato.id, dato.nombre, dato.categoria, dato.precio, dato.stock)
);

// Carrito-> { productoId, cantidad }.
// Guardo solo el id, el precio y stock lo saco del catalogo.
const carrito = [];

// Historial de pedidos confirmados.
const pedidos = [];