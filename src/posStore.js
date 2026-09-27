import { create } from 'zustand';
import { dbService } from './services/dbService';

const TASA_INICIAL = 45.50;

const PRODUCTOS_DEFAULT = [
  { id: '1', codigo: '7591001000123', nombre: 'Harina PAN Blanca 1kg', precioUSD: 1.10, stock: 45 },
  { id: '2', codigo: '7591002000456', nombre: 'Arroz Blanco Primor 1kg', precioUSD: 1.35, stock: 30 },
  { id: '3', codigo: '7591003000789', nombre: 'Pasta Corta Plumitas 500g', precioUSD: 0.95, stock: 60 },
  { id: '4', codigo: '7591004000321', nombre: 'Aceite Mazeite 1L', precioUSD: 3.20, stock: 15 },
  { id: '5', codigo: '7591005000654', nombre: 'Azúcar Montalbán 1kg', precioUSD: 1.25, stock: 20 },
];

export const usePosStore = create((set, get) => ({
  tasaCambio: TASA_INICIAL,
  isOnline: false,
  setTasaCambio: (nuevaTasa) => set({ tasaCambio: Number(nuevaTasa) }),

  productos: PRODUCTOS_DEFAULT,
  carrito: [],

  // Cargar productos desde Supabase con fallback a caché local
  cargarProductos: async () => {
    try {
      const isConnected = await dbService.checkConnection();
      set({ isOnline: isConnected });

      const data = await dbService.getProductos();
      if (data && data.length > 0) {
        const mapeados = data.map((p) => ({
          id: String(p.id),
          codigo: p.codigo_barras || '',
          nombre: p.nombre,
          precioUSD: Number(p.precio_usd || 0),
          stock: Number(p.stock || 0),
          costoUSD: Number(p.costo_usd || 0),
          departamento: p.departamento || 'General'
        }));
        set({ productos: mapeados });
      } else if (isConnected) {
        // Si la tabla en Supabase está vacía, subimos los productos base iniciales
        for (const prod of PRODUCTOS_DEFAULT) {
          await dbService.upsertProducto({
            id: prod.id,
            nombre: prod.nombre,
            codigo_barras: prod.codigo,
            precio_usd: prod.precioUSD,
            stock: prod.stock,
            departamento: 'General'
          });
        }
      }
    } catch (err) {
      console.error('Error cargando productos:', err);
      set({ isOnline: false });
    }
  },

  // Guardar o actualizar producto en Supabase
  guardarProducto: async (prod) => {
    const { productos } = get();
    const id = prod.id ? String(prod.id) : String(Date.now());
    const nuevo = { ...prod, id, precioUSD: Number(prod.precioUSD || 0), stock: Number(prod.stock || 0) };

    const existe = productos.find((p) => String(p.id) === id);
    let actualizados = [];
    if (existe) {
      actualizados = productos.map((p) => (String(p.id) === id ? nuevo : p));
    } else {
      actualizados = [...productos, nuevo];
    }
    set({ productos: actualizados });

    await dbService.upsertProducto({
      id: nuevo.id,
      nombre: nuevo.nombre,
      codigo_barras: nuevo.codigo,
      precio_usd: nuevo.precioUSD,
      costo_usd: Number(nuevo.costoUSD || 0),
      stock: nuevo.stock,
      departamento: nuevo.departamento || 'General'
    });
  },

  // Función universal para agregar productos (Pistola, Cámara o Buscador)
  agregarPorCodigo: (codigoBuscado) => {
    const { productos, carrito } = get();
    const codigoLimpio = String(codigoBuscado || '').trim();
    const producto = productos.find((p) => String(p.codigo).trim() === codigoLimpio);

    if (!producto) {
      alert(`Producto con código "${codigoBuscado}" no encontrado.`);
      return false;
    }

    const itemExistente = carrito.find((item) => String(item.id) === String(producto.id));
    if (itemExistente) {
      set({
        carrito: carrito.map((item) =>
          String(item.id) === String(producto.id)
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
      set({ carrito: carrito.filter((item) => String(item.id) !== String(id)) });
    } else {
      set({
        carrito: carrito.map((item) =>
          String(item.id) === String(id) ? { ...item, cantidad: nuevaCantidad } : item
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

  // Registrar venta completada en Supabase
  procesarVenta: async (datosVenta) => {
    const { carrito, obtenerTotales, tasaCambio, limpiarCarrito, productos } = get();
    const { totalUSD, totalBS } = obtenerTotales();

    const ventaId = 'V-' + Date.now();
    const nuevaVenta = {
      id: ventaId,
      fecha: new Date().toISOString(),
      cajero_id: datosVenta?.cajeroId || 'caja-01',
      cajero_nombre: datosVenta?.cajeroNombre || 'Principal',
      terminal_id: 'TERM-01',
      terminal_nombre: 'Caja 01 - Principal',
      cliente: datosVenta?.cliente || { nombre: 'Consumidor Final', cedula: '' },
      items: carrito,
      total_usd: Number(totalUSD),
      total_bs: Number(totalBS),
      tasa_bcv: tasaCambio,
      metodos_pago: datosVenta?.metodosPago || [],
      sincronizado: true
    };

    // Descontar inventario local
    const nuevoInventario = productos.map((prod) => {
      const itemVendido = carrito.find((item) => String(item.id) === String(prod.id));
      if (itemVendido) {
        const nuevoStock = prod.stock - itemVendido.cantidad;
        return { ...prod, stock: nuevoStock };
      }
      return prod;
    });
    set({ productos: nuevoInventario });

    // Actualizar stock en Supabase
    for (const item of carrito) {
      const prodOriginal = productos.find((p) => String(p.id) === String(item.id));
      if (prodOriginal) {
        dbService.upsertProducto({
          id: String(prodOriginal.id),
          nombre: prodOriginal.nombre,
          codigo_barras: prodOriginal.codigo,
          precio_usd: prodOriginal.precioUSD,
          stock: prodOriginal.stock - item.cantidad
        }).catch(console.error);
      }
    }

    // Registrar en Supabase
    const resultado = await dbService.registrarVenta(nuevaVenta);
    limpiarCarrito();
    return { success: true, ventaId, ...resultado };
  }
}));
