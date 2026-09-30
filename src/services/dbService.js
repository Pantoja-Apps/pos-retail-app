import { supabase } from './supabaseClient'

export const dbService = {
  // 1. Iniciar sesion como dueno
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

  // 2. Iniciar sesion cajero con PIN
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

  // 3. Obtener negocio
  async getNegocio(negocioId) {
    try {
      const { data } = await supabase.from('negocios').select('*').eq('id', negocioId).single();
      return data;
    } catch {
      return null;
    }
  },

  // 4. Actualizar configuracion de negocio
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

  // 5. Productos
  async getProductos(negocioId) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('nombre', { ascending: true });
      if (error) return [];
      return data || [];
    } catch {
      return [];
    }
  },

  async guardarProducto(producto) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .upsert(producto)
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  async eliminarProducto(productoId) {
    try {
      const { error } = await supabase.from('productos').delete().eq('id', productoId);
      return !error;
    } catch {
      return false;
    }
  },

  // 6. Ventas
  async registrarVenta(venta) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .insert([venta])
        .select()
        .single();
      if (error) return null;
      return data;
    } catch {
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

  // 7. Clientes y Creditos
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
