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
      const { data, error } = await supabase
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
      return data || [];
    } catch (e) {
      return [];
    }
  },

  async upsertProducto(prod) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('productos')
        .upsert([prod]);
      return !error;
    } catch (e) {
      return false;
    }
  },

  async registrarVenta(venta) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([venta]);
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
