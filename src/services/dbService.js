import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseInstance = null;
try {
  if (SUPABASE_URL && SUPABASE_KEY) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (err) {
  console.warn('Supabase no inicializado:', err);
}

export const supabase = supabaseInstance;

export const dbService = {
  async checkConnection() {
    if (!supabase) return false;
    try {
      const { error } = await supabase.from('negocios').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  async registrarNegocio(negocio, dueno) {
    if (!supabase) return false;
    try {
      await supabase.from('negocios').upsert([{
        id: negocio.id,
        nombre: negocio.nombre
      }]);
      await supabase.from('usuarios').upsert([{
        id: dueno.id,
        negocio_id: negocio.id,
        nombre: dueno.nombre,
        correo: (dueno.correo || '').toLowerCase().trim(),
        password: dueno.password,
        rol: 'dueno'
      }]);
      return true;
    } catch (e) {
      console.error('Error registrando negocio:', e);
      return false;
    }
  },

  async loginDueno(correo, password) {
    if (!supabase) return null;
    try {
      const correoLimpio = (correo || '').toLowerCase().trim();
      
      const { data: usuario, error: errUser } = await supabase
        .from('usuarios')
        .select('*')
        .eq('correo', correoLimpio)
        .eq('password', password)
        .eq('rol', 'dueno')
        .maybeSingle();

      if (errUser || !usuario) return null;

      let negocio = { id: usuario.negocio_id || 'neg_local', nombre: 'Mi Negocio' };
      if (usuario.negocio_id) {
        const { data: negData } = await supabase
          .from('negocios')
          .select('*')
          .eq('id', usuario.negocio_id)
          .maybeSingle();
        if (negData) negocio = negData;
      }

      return { usuario, negocio };
    } catch (e) {
      console.error('Error en login:', e);
      return null;
    }
  },

  async getNegocio(negocioId) {
    if (!supabase || !negocioId) return null;
    try {
      const { data, error } = await supabase
        .from('negocios')
        .select('*')
        .eq('id', negocioId)
        .maybeSingle();

      if (error || !data) return null;
      return data;
    } catch (e) {
      return null;
    }
  },

  async actualizarConfigNegocio(negocioId, datosConfig) {
    if (!supabase || !negocioId) return false;
    try {
      const updateData = {
        nombre: datosConfig.nombre,
        rif: datosConfig.rif || null,
        direccion: datosConfig.direccion || null,
        telefono: datosConfig.telefono || null,
        logo: datosConfig.logo || null,
        mensaje_pie: datosConfig.mensajePie || null
      };

      const { error } = await supabase
        .from('negocios')
        .update(updateData)
        .eq('id', negocioId);

      return !error;
    } catch (e) {
      return false;
    }
  },

  async getCajeros(negocioId) {
    if (!supabase || !negocioId) return [];
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('negocio_id', negocioId)
        .eq('rol', 'cajero');

      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  },

  async upsertCajero(cajero) {
    if (!supabase) return null;
    try {
      const { error } = await supabase
        .from('usuarios')
        .upsert([{
          id: String(cajero.id),
          negocio_id: cajero.negocio_id,
          nombre: cajero.nombre,
          pin: String(cajero.pin),
          rol: 'cajero'
        }]);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async eliminarCajero(cajeroId) {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', String(cajeroId));
      return !error;
    } catch (e) {
      return false;
    }
  },

  async getProductos(negocioId) {
    if (!supabase || !negocioId) return [];
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('negocio_id', negocioId);

      if (error || !data) return [];
      return data.map(p => ({
        id: String(p.id),
        codigo: p.codigo_barras || '',
        nombre: p.nombre,
        costoUSD: Number(p.costo_usd || 0),
        precioUSD: Number(p.precio_usd || 0),
        esPesado: Boolean(p.es_pesado),
        aplicaPrecioMayor: Boolean(p.aplica_precio_mayor),
        precioMayorUSD: Number(p.precio_mayor_usd || 0),
        cantMinimaMayor: Number(p.cant_minima_mayor || 3),
        stock: Number(p.stock || 0),
        categoria: p.departamento || 'General',
        imagen: p.imagen || ''
      }));
    } catch (e) {
      return [];
    }
  },

  async upsertProducto(prod, negocioId) {
    if (!supabase || !negocioId) return false;
    try {
      const payload = {
        id: String(prod.id),
        negocio_id: negocioId,
        codigo_barras: String(prod.codigo || '').trim(),
        nombre: prod.nombre,
        costo_usd: Number(prod.costoUSD || 0),
        precio_usd: Number(prod.precioUSD || 0),
        es_pesado: Boolean(prod.esPesado),
        aplica_precio_mayor: Boolean(prod.aplicaPrecioMayor),
        precio_mayor_usd: Number(prod.precioMayorUSD || 0),
        cant_minima_mayor: Number(prod.cantMinimaMayor || 3),
        stock: Number(prod.stock || 0),
        departamento: prod.categoria || 'General',
        imagen: prod.imagen || ''
      };

      const { error } = await supabase.from('productos').upsert([payload]);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async eliminarProducto(id, negocioId) {
    if (!supabase || !negocioId) return false;
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', String(id))
        .eq('negocio_id', negocioId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async registrarVenta(venta) {
    if (!supabase) return null;
    try {
      const { error } = await supabase.from('ventas').insert([venta]);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async getVentas(negocioId) {
    if (!supabase || !negocioId) return [];
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false });

      return Array.isArray(data) ? data : [];
    } catch (e) {
      return [];
    }
  }
};
