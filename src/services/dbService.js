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

  // REGISTRO DE NEGOCIO Y DUEÑO
  async registrarNegocio(datosNegocio, datosDueno) {
    try {
      const { error: errNeg } = await supabase.from('negocios').upsert([{
        id: String(datosNegocio.id),
        nombre: datosNegocio.nombre,
        rif: datosNegocio.rif || '',
        telefono: datosNegocio.telefono || '',
        direccion: datosNegocio.direccion || ''
      }]);
      if (errNeg) console.error('Error en tabla negocios:', errNeg);

      const { error: errUsr } = await supabase.from('usuarios').upsert([{
        id: String(datosDueno.id || 'usr_' + Date.now()),
        negocio_id: String(datosNegocio.id),
        nombre: datosDueno.nombre,
        rol: 'dueno',
        correo: datosDueno.correo
      }]);
      if (errUsr) console.error('Error en tabla usuarios:', errUsr);

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

  // PRODUCTOS CON SOPORTE DE PESO Y MAYORISTA
  async getProductos(negocioId) {
    try {
      let query = supabase.from('productos').select('*').order('nombre');
      if (negocioId) {
        query = query.eq('negocio_id', String(negocioId));
      }
      const { data, error } = await query;
      if (error || !data) throw error;

      // Mapeo asegurando campos booleanos y numéricos correctos
      const formateados = data.map(p => ({
        id: p.id,
        codigo: p.codigo_barras || '',
        nombre: p.nombre,
        precioUSD: Number(p.precio_usd || 0),
        costoUSD: Number(p.costo_usd || 0),
        stock: Number(p.stock || 0),
        categoria: p.departamento || 'General',
        esPesado: Boolean(p.es_pesado),
        aplicaPrecioMayor: Boolean(p.aplica_precio_mayor),
        precioMayorUSD: Number(p.precio_mayor_usd || 0),
        cantMinimaMayor: Number(p.cant_minima_mayor || 3)
      }));

      localStorage.setItem(`pos_inventario_${negocioId}`, JSON.stringify(formateados));
      return formateados;
    } catch (err) {
      console.warn('Usando caché local de productos:', err);
      const cache = localStorage.getItem(`pos_inventario_${negocioId}`);
      return cache ? JSON.parse(cache) : [];
    }
  },

  async upsertProducto(producto) {
    try {
      const payload = {
        id: String(producto.id),
        negocio_id: producto.negocio_id ? String(producto.negocio_id) : undefined,
        nombre: producto.nombre,
        codigo_barras: producto.codigo || producto.codigo_barras || '',
        precio_usd: Number(producto.precioUSD ?? producto.precio_usd ?? 0),
        costo_usd: Number(producto.costoUSD ?? producto.costo_usd ?? 0),
        stock: Number(producto.stock ?? 0),
        departamento: producto.categoria || producto.departamento || 'General',
        es_pesado: Boolean(producto.esPesado ?? producto.es_pesado),
        aplica_precio_mayor: Boolean(producto.aplicaPrecioMayor ?? producto.aplica_precio_mayor),
        precio_mayor_usd: Number(producto.precioMayorUSD ?? producto.precio_mayor_usd ?? 0),
        cant_minima_mayor: Number(producto.cantMinimaMayor ?? producto.cant_minima_mayor ?? 3)
      };

      const { data, error } = await supabase.from('productos').upsert([payload]).select();
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
