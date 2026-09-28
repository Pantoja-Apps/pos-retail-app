import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'tu-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const dbService = {
  async checkConnection() {
    try {
      const { data, error } = await supabase.from('negocios').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async registrarNegocio(negocio, usuario) {
    try {
      await supabase.from('negocios').insert([negocio]);
      await supabase.from('usuarios').insert([usuario]);
      return true;
    } catch {
      return false;
    }
  },

  async loginDueno(correo, password) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, negocios(*)')
        .eq('correo', correo)
        .eq('password', password)
        .single();
      if (error || !data) return null;
      return { usuario: data, negocio: data.negocios };
    } catch {
      return null;
    }
  },

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
      await supabase.from('negocios').update({
        nombre: config.nombre,
        rif: config.rif,
        direccion: config.direccion,
        telefono: config.telefono,
        logo: config.logo,
        mensaje_pie: config.mensajePie
      }).eq('id', negocioId);
      return true;
    } catch {
      return false;
    }
  },

  async getCajeros(negocioId) {
    try {
      const { data } = await supabase.from('cajeros').select('*').eq('negocio_id', negocioId);
      return data || [];
    } catch {
      return [];
    }
  },

  async upsertCajero(cajero) {
    try {
      await supabase.from('cajeros').upsert([cajero]);
      return true;
    } catch {
      return false;
    }
  },

  async eliminarCajero(cajeroId) {
    try {
      await supabase.from('cajeros').delete().eq('id', cajeroId);
      return true;
    } catch {
      return false;
    }
  },

  async getProductos(negocioId) {
    try {
      const { data } = await supabase.from('productos').select('*').eq('negocio_id', negocioId);
      if (!data) return [];
      return data.map(p => ({
        id: p.id,
        codigo: p.codigo_barras || p.codigo,
        nombre: p.nombre,
        categoria: p.departamento || p.categoria || 'Víveres',
        costoUSD: Number(p.costo_usd || 0),
        precioUSD: Number(p.precio_usd || 0),
        stock: Number(p.stock || 0),
        esPesado: Boolean(p.es_pesado),
        aplicaPrecioMayor: Boolean(p.aplica_precio_mayor),
        precioMayorUSD: Number(p.precio_mayor_usd || 0),
        cantMinimaMayor: Number(p.cant_minima_mayor || 3),
        imagen: p.imagen || '',
        // IVA y Proveedor recuperados
        ivaTipo: p.iva_tipo || (p.exento_iva === false ? '16' : 'exento'),
        exentoIVA: p.exento_iva !== false,
        proveedorId: p.proveedor_id || '',
        proveedorNombre: p.proveedor_nombre || '',
        tipoEmpaque: p.tipo_empaque || 'Bulto',
        undsPorEmpaque: Number(p.unds_por_empaque || 1),
        costoEmpaqueUSD: Number(p.costo_empaque_usd || p.costo_usd || 0)
      }));
    } catch {
      return [];
    }
  },

  async upsertProducto(prod, negocioId) {
    try {
      const payload = {
        id: String(prod.id),
        negocio_id: negocioId,
        codigo_barras: prod.codigo,
        nombre: prod.nombre,
        costo_usd: prod.costoUSD,
        precio_usd: prod.precioUSD,
        stock: prod.stock,
        es_pesado: prod.esPesado,
        aplica_precio_mayor: prod.aplicaPrecioMayor,
        precio_mayor_usd: prod.precioMayorUSD,
        cant_minima_mayor: prod.cantMinimaMayor,
        departamento: prod.categoria,
        imagen: prod.imagen || '',
        // Campos persistentes de IVA y Proveedor
        iva_tipo: prod.ivaTipo || (prod.exentoIVA ? 'exento' : '16'),
        exento_iva: prod.ivaTipo === 'exento' || prod.exentoIVA === true,
        proveedor_id: prod.proveedorId || null,
        proveedor_nombre: prod.proveedorNombre || null,
        tipo_empaque: prod.tipoEmpaque || 'Bulto',
        unds_por_empaque: prod.undsPorEmpaque || 1,
        costo_empaque_usd: prod.costoEmpaqueUSD || prod.costoUSD
      };
      await supabase.from('productos').upsert([payload]);
      return true;
    } catch {
      return false;
    }
  },

  async eliminarProducto(prodId, negocioId) {
    try {
      await supabase.from('productos').delete().eq('id', prodId).eq('negocio_id', negocioId);
      return true;
    } catch {
      return false;
    }
  },

  async registrarVenta(venta) {
    try {
      await supabase.from('ventas').insert([venta]);
      return true;
    } catch {
      return false;
    }
  },

  async getVentas(negocioId) {
    try {
      const { data } = await supabase
        .from('ventas')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false });
      return data || [];
    } catch {
      return [];
    }
  }
};
