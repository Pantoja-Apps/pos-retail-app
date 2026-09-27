import { supabase } from './supabaseClient';

export const dbService = {
  async checkConnection() {
    try {
      const { error } = await supabase.from('productos').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // REGISTRO SEGURO DE NEGOCIO Y DUEÑO
  async registrarNegocio(datosNegocio, datosDueno) {
    try {
      // 1. Guardar primero el negocio
      const { error: errNeg } = await supabase.from('negocios').upsert([{
        id: String(datosNegocio.id),
        nombre: datosNegocio.nombre,
        rif: datosNegocio.rif || '',
        telefono: datosNegocio.telefono || '',
        direccion: datosNegocio.direccion || ''
      }]);
      if (errNeg) {
        console.error('Error en tabla negocios:', errNeg);
      }

      // 2. Guardar el usuario dueño
      const { error: errUsr } = await supabase.from('usuarios').upsert([{
        id: String(datosDueno.id || 'usr_' + Date.now()),
        negocio_id: String(datosNegocio.id),
        nombre: datosDueno.nombre,
        rol: 'dueno',
        correo: datosDueno.correo
      }]);
      if (errUsr) {
        console.error('Error en tabla usuarios:', errUsr);
      }

      // Devuelve éxito aunque haya warning de backend para no trancar la app
      return { success: true };
    } catch (err) {
      console.error('Error general registrando negocio:', err);
      return { success: true, offline: true };
    }
  },

  async getCajeros(negocioId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('negocio_id', String(negocioId))
        .eq('rol', 'cajero');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error obteniendo cajeros:', err);
      return [];
    }
  },

  async upsertCajero(cajero) {
    try {
      const { error } = await supabase.from('usuarios').upsert([cajero]);
      return !error;
    } catch {
      return false;
    }
  },

  async getProductos(negocioId) {
    try {
      let query = supabase.from('productos').select('*').order('nombre');
      if (negocioId) {
        query = query.eq('negocio_id', String(negocioId));
      }
      const { data, error } = await query;
      if (error || !data) throw error;
      localStorage.setItem(`pos_inventario_${negocioId}`, JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Usando caché local de productos:', err);
      const cache = localStorage.getItem(`pos_inventario_${negocioId}`);
      return cache ? JSON.parse(cache) : [];
    }
  },

  async upsertProducto(producto) {
    try {
      const { data, error } = await supabase.from('productos').upsert([producto]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error sincronizando producto:', err);
      return { success: true, offline: true };
    }
  },

  async registrarVenta(venta) {
    try {
      const { data, error } = await supabase.from('ventas').insert([venta]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error registrando venta:', err);
      const pendientes = JSON.parse(localStorage.getItem('pos_ventas_pendientes') || '[]');
      pendientes.push(venta);
      localStorage.setItem('pos_ventas_pendientes', JSON.stringify(pendientes));
      return { success: true, offline: true };
    }
  },

  async getVentas(negocioId) {
    try {
      let query = supabase.from('ventas').select('*').order('fecha', { ascending: false });
      if (negocioId) {
        query = query.eq('negocio_id', String(negocioId));
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error obteniendo ventas:', err);
      return [];
    }
  }
};
