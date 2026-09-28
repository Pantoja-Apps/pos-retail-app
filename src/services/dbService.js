import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = (SUPABASE_URL && SUPABASE_KEY) 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

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
    if (!supabase) return null;
    try {
      await supabase.from('negocios').upsert([negocio]);
      await supabase.from('usuarios').upsert([{
        id: dueno.id,
        negocio_id: negocio.id,
        nombre: dueno.nombre,
        correo: dueno.correo,
        password: dueno.password,
        rol: 'dueno'
      }]);
      return true;
    } catch (e) {
      console.error('Error registrando negocio:', e);
      return false;
    }
  },

  async actualizarConfigNegocio(negocioId, datosConfig) {
    if (!supabase || !negocioId) return false;
    try {
      const { error } = await supabase
        .from('negocios')
        .update({
          nombre: datosConfig.nombre,
          rif: datosConfig.rif,
          direccion: datosConfig.direccion,
          telefono: datosConfig.telefono,
          logo_url: datosConfig.logo || null,
          mensaje_pie: datosConfig.mensajePie
        })
        .eq('id', negocioId);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async subirImagenStorage(negocioId, nombreArchivo, base64Data) {
    if (!supabase || !negocioId || !base64Data) return base64Data;
    try {
      // Si el bucket existe, subir; sino devolver base64 directo
      const blob = await (await fetch(base64Data)).blob();
      const path = `${negocioId}/${Date.now()}_${nombreArchivo}`;
      const { data, error } = await supabase.storage.from('pos-imagenes').upload(path, blob, {
        contentType: blob.type,
        upsert: true
      });
      if (error || !data) return base64Data;

      const { data: pubData } = supabase.storage.from('pos-imagenes').getPublicUrl(path);
      return pubData?.publicUrl || base64Data;
    } catch (e) {
      return base64Data;
    }
  },

  async loginDueno(correo, password) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*, negocios(*)')
        .eq('correo', correo)
        .eq('password', password)
        .eq('rol', 'dueno')
        .single();

      if (error || !data) return null;
      return { usuario: data, negocio: data.negocios };
    } catch (e) {
      return null;
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

      if (error) return [];
      return data || [];
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

      if (error) return [];
      return (data || []).map(p => ({
        id: String(p.id),
        codigo: p.codigo,
        nombre: p.nombre,
        costoUSD: Number(p.costo_usd || 0),
        precioUSD: Number(p.precio_usd || 0),
        esPesado: Boolean(p.es_pesado),
        aplicaPrecioMayor: Boolean(p.aplica_precio_mayor),
        precioMayorUSD: Number(p.precio_mayor_usd || 0),
        cantMinimaMayor: Number(p.cant_minima_mayor || 3),
        stock: Number(p.stock || 0),
        categoria: p.categoria || 'General',
        imagen: p.imagen_url || ''
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
        codigo: String(prod.codigo || '').trim(),
        nombre: prod.nombre,
        costo_usd: Number(prod.costoUSD || 0),
        precio_usd: Number(prod.precioUSD || 0),
        es_pesado: Boolean(prod.esPesado),
        aplica_precio_mayor: Boolean(prod.aplicaPrecioMayor),
        precio_mayor_usd: Number(prod.precioMayorUSD || 0),
        cant_minima_mayor: Number(prod.cantMinimaMayor || 3),
        stock: Number(prod.stock || 0),
        categoria: prod.categoria || 'General',
        imagen_url: prod.imagen || ''
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

      if (error) return [];
      return data || [];
    } catch (e) {
      return [];
    }
  }
};
