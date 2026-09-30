import { supabase } from './supabaseClient'

// Normaliza el producto de Supabase hacia el formato interno de React
const normalizarProducto = (p) => {
  const pUSD = parseFloat(p.precio_usd ?? p.precioUSD ?? 0) || 0;
  const pCosto = parseFloat(p.costo_usd ?? p.costoUSD ?? 0) || 0;
  const stockVal = parseFloat(p.stock ?? 0) || 0;

  // Detección estricta de IVA con las columnas reales: aplica_iva y tasa_iva
  const esGravable = Boolean(p.aplica_iva === true || Number(p.tasa_iva) === 16 || p.ivaTipo === '16');

  return {
    ...p,
    id: p.id,
    nombre: p.nombre || 'Producto sin nombre',
    codigo: p.codigo_barras || p.codigo || '',
    categoria: p.departamento || p.categoria || 'Víveres',
    proveedorId: p.proveedor_id || p.proveedorId || '',
    proveedorNombre: p.proveedor_nombre || p.proveedorNombre || '',
    precioUSD: pUSD,
    precioBS: 0, // Se calcula dinámicamente con la tasa activa
    costoUSD: pCosto,
    stock: stockVal,
    esPesado: Boolean(p.es_pesado ?? p.esPesado),
    ivaTipo: esGravable ? '16' : 'exento',
    iva: esGravable ? 16 : 0,
    tasa_iva: esGravable ? 16 : 0,
    aplica_iva: esGravable,
    exentoIVA: !esGravable,
    tipoEmpaque: p.tipo_empaque || p.tipoEmpaque || 'Bulto',
    undsPorEmpaque: parseFloat(p.unidades_empaque ?? p.undsPorEmpaque ?? 1) || 1,
    costoEmpaqueUSD: parseFloat(p.costo_empaque_usd ?? p.costoEmpaqueUSD ?? pCosto) || 0,
    aplicaPrecioMayor: Boolean(p.aplica_precio_mayor ?? p.aplicaPrecioMayor),
    precioMayorUSD: parseFloat(p.precio_mayor_usd ?? p.precioMayorUSD ?? 0) || 0,
    cantMinimaMayor: parseInt(p.cant_minima_mayor ?? p.cantMinimaMayor ?? 3) || 3,
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

  // 4. Productos
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
      const esGravable = String(producto.ivaTipo) === '16' || Number(producto.iva) === 16;
      
      // Mapeo exacto a las columnas reales de Supabase:
      const itemBD = {
        id: producto.id,
        nombre: producto.nombre || 'Producto sin nombre',
        codigo_barras: producto.codigo || producto.codigo_barras || '',
        departamento: producto.categoria || producto.departamento || 'Víveres',
        precio_usd: parseFloat(producto.precioUSD) || 0,
        costo_usd: parseFloat(producto.costoUSD) || 0,
        stock: parseFloat(producto.stock) || 0,
        es_pesado: Boolean(producto.esPesado),
        aplica_iva: esGravable,
        tasa_iva: esGravable ? 16 : 0,
        tipo_empaque: producto.tipoEmpaque || 'Bulto',
        unidades_empaque: parseFloat(producto.undsPorEmpaque) || 1,
        costo_empaque_usd: parseFloat(producto.costoEmpaqueUSD) || 0,
        aplica_precio_mayor: Boolean(producto.aplicaPrecioMayor),
        precio_mayor_usd: parseFloat(producto.precioMayorUSD) || 0,
        cant_minima_mayor: parseInt(producto.cantMinimaMayor) || 3,
        proveedor_id: producto.proveedorId || null,
        proveedor_nombre: producto.proveedorNombre || null,
        imagen: producto.imagen || producto.foto || ''
      };

      if (negocioId && !itemBD.negocio_id) {
        itemBD.negocio_id = negocioId;
      }

      const { data, error } = await supabase
        .from('productos')
        .upsert(itemBD)
        .select()
        .single();

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return normalizarProducto(producto);
      }
      return normalizarProducto(data);
    } catch (err) {
      console.error('Excepción al guardar producto:', err);
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
