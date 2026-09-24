import { create } from 'zustand';

// Tasa de cambio inicial del día (BCV o paralelo)
const TASA_INICIAL = 45.50;

export const usePosStore = create((set, get) => ({
  tasaCambio: TASA_INICIAL,
  setTasaCambio: (nuevaTasa) => set({ tasaCambio: Number(nuevaTasa) }),

  // Productos de prueba con códigos EAN-13 estándar de víveres
  productos: [
    { id: 1, codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', precioUSD: 1.10, stock: 45 },
    { id: 2, codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', precioUSD: 1.35, stock: 30 },
    { id: 3, codigo: '7591003000789', nombre: 'Pasta Corta Plumitas 500g', precioUSD: 0.95, stock: 60 },
    { id: 4, codigo: '7591004000321', nombre: 'Aceite Mazeite 1L', precioUSD: 3.20, stock: 15 },
    { id: 5, codigo: '7591005000654', nombre: 'Azúcar Montalbán 1kg', precioUSD: 1.25, stock: 20 },
  ],

  // Carrito de venta actual
  carrito: [],

  // Función universal para agregar productos (funciona con Pistola, Cámara o Buscador)
  agregarPorCodigo: (codigoBuscado) => {
    const { productos, carrito } = get();
    const producto = productos.find((p) => p.codigo === codigoBuscado.trim());

    if (!producto) {
      alert(`Producto con código "${codigoBuscado}" no encontrado.`);
      return false;
    }

    const itemExistente = carrito.find((item) => item.id === producto.id);

    if (itemExistente) {
      set({
        carrito: carrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        ),
      });
    } else {
      set({
        carrito: [...carrito, { ...producto, cantidad: 1 }],
      });
    }
    return true;
  },

  // Modificar cantidad directamente en el carrito (+ o -)
  actualizarCantidad: (id, nuevaCantidad) => {
    const { carrito } = get();
    if (nuevaCantidad <= 0) {
      set({ carrito: carrito.filter((item) => item.id !== id) });
    } else {
      set({
        carrito: carrito.map((item) =>
          item.id === id ? { ...item, cantidad: nuevaCantidad } : item
        ),
      });
    }
  },

  // Limpiar venta actual
  limpiarCarrito: () => set({ carrito: [] }),

  // Totales calculados en tiempo real
  obtenerTotales: () => {
    const { carrito, tasaCambio } = get();
    const totalUSD = carrito.reduce(
      (acc, item) => acc + item.precioUSD * item.cantidad,
      0
    );
    const totalBS = totalUSD * tasaCambio;
    return {
      totalUSD: totalUSD.toFixed(2),
      totalBS: totalBS.toFixed(2),
    };
  },
}));
