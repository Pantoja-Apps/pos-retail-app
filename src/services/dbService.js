import { supabase } from './supabaseClient'

// Función para normalizar de forma inequívoca los datos de la base de datos
const normalizarProducto = (p) => {
  const pUSD = parseFloat(p.precioUSD ?? p.precio_usd ?? p.precio ?? 0) || 0;
  const pBS = parseFloat(p.precioBS ?? p.precio_bs ?? 0) || 0;
  const pCosto = parseFloat(p.costoUSD ?? p.costo_unit_usd ?? p.precio_costo ?? 0) || 0;
  const stockVal = parseFloat(p.stock ?? 0) || 0;

  // Detección universal del IVA: solo si explícitamente es 16 o '16'
  const rawIva = p.ivaTipo ?? p.iva_tipo ?? p.iva ?? p.tasa_iva;
  const es16 = String(rawIva) === '16';
  const tipoFinal = es16 ? '16' : 'exento';

  return {
    ...p,
    id: p.id,
    nombre: p.nombre || 'Producto sin nombre',
    codigo: p.codigo || '',
    categoria: p.categoria || 'Víveres',
    proveedorId: p.proveedorId ?? p.proveedor_id ?? '',
    proveedorNombre: p.proveedorNombre ?? p.proveedor_nombre ?? '',
    precioUSD: pUSD,
    precioBS: pBS,
    costoUSD: pCosto,
    stock: stockVal,
    esPesado: Boolean(p.esPesado ?? p.es_pesado),
    ivaTipo: tipoFinal,
    iva: es16 ? 16 : 0,
    tasa_iva: es16 ? 16 : 0,
    exentoIVA: !es16,
    tipoEmpaque: p.tipoEmpaque ?? p.tipo_empaque ?? 'Bulto',
    undsPorEmpaque: parseFloat(p.undsPorEmpaque ?? p.unds_por_empaque ?? 1) || 1,
    costoEmpaqueUSD: parseFloat(p.costoEmpaqueUSD ?? p.costo_emaque_usd ?? pCosto) || 0,
    aplicaPrecioMayor: Boolean(p.aplicaPrecioMayor ?? p.aplica_precio_mayor),
    precioMayorUSD: parseFloat(p.precioMayorUSD ?? p.precio_mayor_usd ?? 0) || 0,
    cantMinimaMayor: parseInt(p.cantMinimaMayor ?? p.cant_minima_mayor ?? 3) || 3,
    imagen: p.imagen || p.foto || ''
  };
};

export const dbService = {
  // Verificación de conectividad con Supabase
  async checkConnection() {
    try {
      const { error } = await supabase.from('negocios').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // 1. Iniciar sesión como dueño
  async loginDueno(correo, password) {
    try {
      const { data: usuario, error: errUser } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correo)
        .eq('password', password)
        .single();

      if (errUser || !usuario) return null;

      let negocio = null;
      if (usuario.negocio_id) {
        const { data: negData } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', usuario.negocio_id)
          .single();
        negocio = negData;
      }

      return { usuario, negocio: negocio || { id: usuario.negocio_id, nombre: 'Mi Negocio' } };
    } catch {
      return null;
    }
  },

  // 2. Iniciar sesión cajero con PIN
  async loginCajero(pin, negocioId) {
    try {
      let query = supabase.from('usuarios').select('*').eq('pin', pin);
      if (negocioId) {
        query = query.eq('negocio_id', negocioId);
      }
      const { data, error } = await query.single();
      if (error || !data) return null;
      return data;
    } catch {
      return null;
    }
  },

  // Obtener cajeros de un negocio
  async getCajeros(negocioId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('negocio_id', negocioId)
        .eq('rol', 'cajero');
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // 3. Negocio
  async getNegocio(negocioId) {
    try {
      const { data } = await supabase.from('negocios').select('*').eq('id', negocioId).single();
      return data;
    } catch {
      return null;
    }
  },

  async actualizarConfigNegocio(negocioId, config) {
    try {
      const { data, error } = await supabase
        .from('negocios')
        .update(config)
        .eq('id', negocioId)
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  // 4. Productos normalizados
  async getProductos(negocioId) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('nombre', { ascending: true });
      if (error || !data) return [];
      return data.map(normalizarProducto);
    } catch {
      return [];
    }
  },

  async guardarProducto(producto, negocioId) {
    try {
      const es16 = String(producto.ivaTipo || producto.iva) === '16';
      const item = {
        id: producto.id,
        nombre: producto.nombre,
        codigo: producto.codigo,
        categoria: producto.categoria || 'Víveres',
        precio_usd: producto.precioUSD ?? producto.precio_usd ?? 0,
        precio_bs: producto.precioBS ?? producto.precio_bs ?? 0,
        precio_costo: producto.costoUSD ?? producto.precio_costo ?? 0,
        stock: producto.stock ?? 0,
        es_pesado: Boolean(producto.esPesado ?? producto.es_pesado),
        tasa_iva: es16 ? 16 : 0,
        imagen: producto.imagen || producto.foto || ''
      };

      if (negocioId && !item.negocio_id) item.negocio_id = negocioId;

      const { data, error } = await supabase
        .from('productos')
        .upsert(item)
        .select()
        .single();

      if (error) {
        console.error('Error al guardar producto en Supabase:', error);
        return normalizarProducto(producto);
      }
      return normalizarProducto(data);
    } catch {
      return normalizarProducto(producto);
    }
  },

  async upsertProducto(producto, negocioId) {
    return this.guardarProducto(producto, negocioId);
  },

  async eliminarProducto(productoId) {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', productoId);
      return !error;
    } catch {
      return false;
    }
  },

  // 5. Ventas
  async registrarVenta(venta) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([venta])
        .select()
        .single();
      if (error) {
        console.error('Error al registrar venta:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Fallo en registrarVenta:', err);
      return null;
    }
  },

  async getVentas(negocioId) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  // 6. Clientes
  async getClientes(negocioId) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('nombre', { ascending: true });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async guardarCliente(cliente) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .upsert(cliente)
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  }
};
