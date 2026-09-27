import { supabase } from './supabaseClient';

export const dbService = {
  // Verificar estado de conexión
  async checkConnection() {
    try {
      const { error } = await supabase.from('productos').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

  // Obtener productos (intenta Supabase, si falla usa LocalStorage)
  async getProductos() {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre');
      if (error || !data) throw error;
      localStorage.setItem('pos_inventario_cache', JSON.stringify(data));
      return data;
    } catch (err) {
      console.warn('Usando caché local de productos:', err);
      const cache = localStorage.getItem('pos_inventario_cache');
      return cache ? JSON.parse(cache) : [];
    }
  },

  // Guardar o actualizar producto
  async upsertProducto(producto) {
    // Guardar en local primero para agilidad
    const cache = JSON.parse(localStorage.getItem('pos_inventario_cache') || '[]');
    const index = cache.findIndex(p => p.id === producto.id);
    if (index >= 0) cache[index] = producto;
    else cache.push(producto);
    localStorage.setItem('pos_inventario_cache', JSON.stringify(cache));

    try {
      const { data, error } = await supabase.from('productos').upsert([producto]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error sincronizando con Supabase:', err);
      return { success: true, offline: true };
    }
  },

  // Registrar venta
  async registrarVenta(venta) {
    try {
      const { data, error } = await supabase.from('ventas').insert([venta]).select();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error('Error enviando venta a Supabase:', err);
      // Guardar en cola pendiente offline
      const pendientes = JSON.parse(localStorage.getItem('pos_ventas_pendientes') || '[]');
      pendientes.push(venta);
      localStorage.setItem('pos_ventas_pendientes', JSON.stringify(pendientes));
      return { success: true, offline: true };
    }
  }
};
