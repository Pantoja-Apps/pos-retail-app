import { supabase } from './supabaseClient'

// Normaliza el producto de Supabase hacia el formato interno de React
const normalizarProducto = (p) => {
  const pUSD = parseFloat(p.precio_usd ?? p.precioUSD ?? 0) || 0;
  const pCosto = parseFloat(p.costo_usd ?? p.costoUSD ?? 0) || 0;
  const stockVal = parseFloat(p.stock ?? 0) || 0;

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
    precioBS: 0,
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

// Normaliza el cliente desde Supabase
const normalizarCliente = (c) => ({
  ...c,
  id: c.id,
  nombre: c.nombre || 'Cliente General',
  doc: c.doc || c.cedula || c.rif || '',
  cedula: c.doc || c.cedula || '',
  rif: c.doc || c.rif || '',
  telefono: c.telefono || '',
  direccion: c.direccion || '',
  limiteCredito: parseFloat(c.limite_credito ?? 0) || 0,
  saldoDeudor: parseFloat(c.saldo_deudor_usd ?? 0) || 0,
  saldoPendienteUSD: parseFloat(c.saldo_deudor_usd ?? 0) || 0,
  saldoDeudorUSD: parseFloat(c.saldo_deudor_usd ?? 0) || 0
});

// Normaliza las transacciones/ventas desde Supabase
const normalizarVenta = (v) => {
  const cerrado = v.estado === 'cerrada' || v.cerradoEnTurno === true;
  return {
    ...v,
    id: v.id,
    fecha: v.fecha || new Date().toISOString(),
    totalUSD: parseFloat(v.total_usd ?? v.totalUSD ?? 0) || 0,
    totalBS: parseFloat(v.total_bs ?? v.totalBS ?? 0) || 0,
    tasaBCV: parseFloat(v.tasa_bcv ?? v.tasaBCV ?? 1) || 1,
    items: v.items || [],
    metodosPago: v.metodos_pago || v.metodosPago || [],
    cliente: v.cliente || null,
    estado: cerrado ? 'cerrada' : (v.estado || 'activa'),
    cerradoEnTurno: cerrado,
    cajeroNombre: v.cajero_nombre || v.cajeroNombre || v.cajero || 'Cajero',
    cajero: v.cajero_nombre || v.cajeroNombre || v.cajero || 'Cajero',
    caja: v.terminal_nombre || v.terminal_id || 'Caja 01',
    terminalNombre: v.terminal_nombre || v.terminalNombre || 'Caja 01'
  };
};

export const dbService = {
  async checkConnection() {
    try {
      const { error } = await supabase.from('negocios').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  },

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

  // PRODUCTOS
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
        cantMinimaMayor: parseInt(producto.cantMinimaMayor) || 3,
        proveedor_id: producto.proveedorId || null,
        proveedor_nombre: producto.proveedorNombre || null,
        imagen: producto.imagen || producto.foto || ''
      };

      if (negocioId && !itemBD.negocio_id) itemBD.negocio_id = negocioId;

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

  // VENTAS
    async registrarVenta(venta, negocioId) {
    try {
      const itemBD = {
        id: String(venta.id),
        negocio_id: negocioId || venta.negocio_id,
        fecha: venta.fecha || new Date().toISOString(),
        cajero_id: String(venta.cajeroId || venta.cajero_id || venta.cajero?.id || 'usr_master'),
        cajero_nombre: venta.cajero || venta.cajeroNombre || venta.cajero_nombre || 'Cajero',
        terminal_id: venta.terminalId || venta.terminal_id || 'caja_01',
        terminal_nombre: venta.caja || venta.terminalNombre || venta.terminal_nombre || 'Caja 01',
        cliente: venta.cliente || null,
        items: venta.items || [],
        total_usd: parseFloat(venta.totalUSD ?? venta.total_usd ?? 0) || 0,
        total_bs: parseFloat(venta.totalBS ?? venta.total_bs ?? 0) || 0,
        tasa_bcv: parseFloat(venta.tasaCambio ?? venta.tasaBCV ?? venta.tasa_bcv ?? 1) || 1,
        metodos_pago: venta.pagos || venta.metodosPago || venta.metodos_pago || [],
        estado: 'activa',
        es_credito: Boolean(venta.esCredito ?? venta.es_credito),
        base_imponible_usd: parseFloat(venta.baseImponibleUSD ?? venta.base_imponible_usd ?? 0) || 0,
        iva_recaudado_usd: parseFloat(venta.ivaRecaudadoUSD ?? venta.iva_recaudado_usd ?? 0) || 0,
        subtotal_exento_usd: parseFloat(venta.subtotalExentoUSD ?? venta.subtotal_exento_usd ?? 0) || 0,
        sincronizado: true
      };

      // Si se definió correlativo, lo agregamos
      if (venta.correlativo) {
        itemBD.correlativo = String(venta.correlativo);
      }

      let res = await supabase.from('ventas').upsert(itemBD).select().single();

      // Si falló por no existir la columna correlativo en la tabla, reintentamos de inmediato sin ese campo
      if (res.error && res.error.message && res.error.message.includes('correlativo')) {
        console.warn('Columna correlativo no existe en Supabase; guardando sin ella para garantizar persistencia.');
        delete itemBD.correlativo;
        res = await supabase.from('ventas').upsert(itemBD).select().single();
      }

      if (res.error) {
        console.error('Error persistente al registrar venta en Supabase:', res.error);
        return normalizarVenta(venta);
      }

      // Si la venta es a crédito, sincronizar o actualizar cliente en Supabase
      if (itemBD.es_credito && venta.cliente?.doc) {
        try {
          const cliDoc = String(venta.cliente.doc).trim();
          const { data: clienteExistente } = await supabase
            .from('clientes')
            .select('*')
            .eq('doc', cliDoc)
            .maybeSingle();

          const saldoAnterior = parseFloat(clienteExistente?.saldo_deudor_usd ?? 0) || 0;
          const nuevoSaldoUSD = parseFloat((saldoAnterior + itemBD.total_usd).toFixed(2));

          const clienteParaGuardar = {
            id: clienteExistente?.id || ('cli_' + Date.now()),
            negocio_id: itemBD.negocio_id,
            doc: cliDoc,
            nombre: venta.cliente.nombre || 'Cliente',
            telefono: venta.cliente.telefono || '',
            saldo_deudor_usd: nuevoSaldoUSD,
            saldo_pendiente_usd: nuevoSaldoUSD
          };

          await supabase.from('clientes').upsert(clienteParaGuardar);
        } catch (errCli) {
          console.error('Error al actualizar saldo deudor en tabla clientes:', errCli);
        }
      }

      return normalizarVenta(res.data || venta);
    } catch (err) {
      console.error('Fallo general en registrarVenta:', err);
      return normalizarVenta(venta);
    }
  },

  async getVentas(negocioId) {
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false });
      if (error || !data) return [];
      return data.map(normalizarVenta);
    } catch {
      return [];
    }
  },

  // Cierra el turno marcando como cerradas todas las ventas que no lo estén
  async cerrarTurno(negocioId) {
    try {
      const { error } = await supabase
        .from('ventas')
        .update({ estado: 'cerrada' })
        .eq('negocio_id', negocioId)
        .neq('estado', 'cerrada');

      if (error) console.error('Error al cerrar turno en Supabase:', error);
      return !error;
    } catch (err) {
      console.error('Excepción al cerrar turno:', err);
      return false;
    }
  },

  // CLIENTES
  async getClientes(negocioId) {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('nombre', { ascending: true });
      if (error || !data) return [];
      return data.map(normalizarCliente);
    } catch {
      return [];
    }
  },

  async guardarCliente(cliente, negocioId) {
    try {
      const docVal = cliente.doc || cliente.cedula || cliente.rif || '';
      const itemBD = {
        id: String(cliente.id || ('cli_' + Date.now())),
        negocio_id: negocioId || cliente.negocio_id,
        nombre: cliente.nombre || 'Cliente General',
        doc: docVal,
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
        limite_credito: parseFloat(cliente.limiteCredito ?? cliente.limite_credito ?? 0) || 0,
        saldo_deudor_usd: parseFloat(cliente.saldoPendienteUSD ?? cliente.saldoDeudor ?? cliente.saldo_deudor_usd ?? 0) || 0 || 0
      };

      const { data, error } = await supabase
        .from('clientes')
        .upsert(itemBD)
        .select()
        .single();

      if (error) {
        console.error('Error al guardar cliente en Supabase:', error);
        return normalizarCliente(cliente);
      }
      return normalizarCliente(data);
    } catch (err) {
      console.error('Excepción al guardar cliente:', err);
      return normalizarCliente(cliente);
    }
  }
};
