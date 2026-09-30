import React from 'react';
import { Printer, Share2, X, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function TicketModal({
  datos,
  config,
  tasaCambio = 855.66,
  alCerrar
}) {
  if (!datos) return null;

  const tasa = Number(datos.tasaCambio || datos.tasa_bcv || tasaCambio || 1);
  const totalUSD = Number(datos.totalUSD ?? datos.total_usd ?? 0);
  const totalBS = Number(datos.totalBS ?? datos.total_bs ?? (totalUSD * tasa));
  const items = datos.items || [];
  const cliente = datos.cliente || {
    nombre: datos.cliente_nombre || 'Consumidor Final',
    doc: datos.cliente_doc || 'V-00000000',
    telefono: datos.cliente_telefono || ''
  };
  const pagos = Array.isArray(datos.pagos) ? datos.pagos : (Array.isArray(datos.metodos_pago) ? datos.metodos_pago : []);

  const obtenerFechaOriginal = () => {
    const raw = datos.fecha || datos.fechaFormateada || datos.created_at;
    if (!raw) return new Date().toLocaleString();
    try {
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(raw);
      return d.toLocaleString('es-VE', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch (e) {
      return String(raw);
    }
  };

  const fechaFija = obtenerFechaOriginal();
  const nombreCajero = datos.cajeroNombre || datos.cajero_nombre || datos.cajero || 'Angel Pantoja';
  const nombreCaja = datos.terminal_nombre || datos.caja_nombre || datos.caja || 'Caja 01';

  let totalPiezasUnid = 0;
  let totalPesoKg = 0;
  let hayUnidades = false;
  let hayPesados = false;

  let subtotalExentoUSD = 0;
  let baseImponibleGravableUSD = 0;
  let impuestoIva16USD = 0;

  items.forEach(it => {
    const cant = Number(it.cantidad || 0);
    const precio = Number(it.precioUSD ?? it.precio_usd ?? 0);
    const subtotalRenglon = precio * cant;

    const esRealmentePesado = Boolean(it.esPesado) || (cant % 1 !== 0);
    if (esRealmentePesado) {
      totalPesoKg += cant;
      hayPesados = true;
    } else {
      totalPiezasUnid += Math.round(cant);
      hayUnidades = true;
    }

    const esGravable = it.ivaTipo === '16' || it.iva === 16 || it.exentoIVA === false;

    if (esGravable) {
      const baseRenglon = subtotalRenglon / 1.16;
      const ivaRenglon = subtotalRenglon - baseRenglon;
      baseImponibleGravableUSD += baseRenglon;
      impuestoIva16USD += ivaRenglon;
    } else {
      subtotalExentoUSD += subtotalRenglon;
    }
  });

  const imprimir = () => {
    window.print();
  };

  const compartirWhatsApp = () => {
    let texto = `*🧾 FACTURA / TICKET DE VENTA*\n`;
    texto += `*${(config?.nombre || 'FACILITO POS').toUpperCase()}*\n`;
    if (config?.rif) texto += `RIF: ${config.rif}\n`;
    if (config?.telefono) texto += `TEL: ${config.telefono}\n`;
    texto += `--------------------------------\n`;
    texto += `CONTROL #: ${datos.correlativo || datos.id}\n`;
    texto += `FECHA: ${fechaFija}\n`;
    texto += `CAJERO / CAJA: ${nombreCajero} · ${nombreCaja}\n`;
    texto += `CLIENTE: ${cliente.nombre}\n`;
    texto += `CÉDULA / RIF: ${cliente.doc}\n`;
    if (cliente.telefono) texto += `TELÉFONO: ${cliente.telefono}\n`;
    texto += `--------------------------------\n`;

    if (datos.esCredito || datos.es_credito) {
      texto += `FORMA DE PAGO: CUENTA POR COBRAR (A CRÉDITO)\n`;
    } else if (pagos.length > 1) {
      texto += `FORMAS DE PAGO (PAGO MIXTO):\n`;
      pagos.forEach(p => {
        const esBolivares = (p.moneda === 'BS') || /bs|móvil|punto/i.test(p.metodo || '');
        if (esBolivares) {
          const montoBsReal = Number(p.montoBS || p.monto || (p.montoUSD ? p.montoUSD * tasa : 0));
          texto += `  • ${p.metodo}: Bs. ${montoBsReal.toFixed(2)}\n`;
        } else {
          const montoUsdReal = Number(p.montoUSD || p.monto || 0);
          texto += `  • ${p.metodo}: $${montoUsdReal.toFixed(2)}\n`;
        }
      });
    } else {
      texto += `FORMA DE PAGO: ${datos.metodoPago || datos.metodos_pago?.[0]?.metodo || 'EFECTIVO'}\n`;
    }

    texto += `--------------------------------\n`;
    items.forEach(it => {
      const cant = Number(it.cantidad || 0);
      const esRealmentePesado = Boolean(it.esPesado) || (cant % 1 !== 0);
      const sub = (Number(it.precioUSD ?? it.precio_usd ?? 0) * cant).toFixed(2);
      const etiquetaCant = esRealmentePesado ? `${cant.toFixed(3)}kg` : `${Math.round(cant)} unid`;
      const indicadorFiscal = (it.ivaTipo === '16' || it.iva === 16 || it.exentoIVA === false) ? '(G)' : '(E)';
      texto += `• ${it.nombre} ${indicadorFiscal}\n`;
      texto += `  ${etiquetaCant} x $${Number(it.precioUSD ?? it.precio_usd ?? 0).toFixed(2)} = $${sub}\n`;
    });

    texto += `--------------------------------\n`;
    if (hayUnidades) texto += `Total Artículos: ${totalPiezasUnid} unids\n`;
    if (hayPesados) texto += `Peso Total: ${totalPesoKg.toFixed(3)} KG\n`;
    if (subtotalExentoUSD > 0) texto += `Subtotal Exento (E): $${subtotalExentoUSD.toFixed(2)}\n`;
    if (baseImponibleGravableUSD > 0) {
      texto += `Base Imponible (G): $${baseImponibleGravableUSD.toFixed(2)}\n`;
      texto += `IVA (16%): $${impuestoIva16USD.toFixed(2)}\n`;
    }
    texto += `*TOTAL FACTURA: $${totalUSD.toFixed(2)}*\n`;
    texto += `*TOTAL BOLÍVARES: Bs. ${totalBS.toFixed(2)}*\n`;
    texto += `Tasa Oficial BCV: Bs. ${tasa.toFixed(2)} / USD\n`;
    texto += `--------------------------------\n`;
    texto += `¡Gracias por su compra!\n`;

    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay}>
      {/* Estilos específicos para impresión en rollo térmico 58mm / 80mm */}
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          body * {
            visibility: hidden;
          }
          #ticket-imprimible, #ticket-imprimible * {
            visibility: visible;
          }
          #ticket-imprimible {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 80mm !important;
            padding: 4mm !important;
            margin: 0 auto !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            color: #000 !important;
            background: #fff !important;
          }
          .no-imprimir {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.modal}>
        {/* Cabecera del Modal (No se imprime) */}
        <div style={styles.header} className="no-imprimir">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} color="#16a34a" />
            <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#16a34a', fontWeight: 'bold' }}>
              Comprobante Generado
            </h3>
          </div>
          <button onClick={alCerrar} style={styles.btnCerrar}>
            <X size={18} />
          </button>
        </div>

        {/* TICKET DIGITAL / TÉRMICO */}
        <div style={styles.ticketContainer} id="ticket-imprimible">
          {config?.logo && (
            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
              <img
                src={config.logo}
                alt="Logo"
                style={{ maxHeight: '42px', maxWidth: '110px', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Encabezado del Comercio */}
          <div style={styles.bloqueEncabezado}>
            <h2 style={styles.nombreNegocio}>{config?.nombre || 'MINIMARKET JJJP'}</h2>
            <div style={styles.textoFiscal}>{config?.rif || 'J-50000000-0'}</div>
            <div style={styles.textoFiscal}>{config?.direccion || 'Caracas, Venezuela'}</div>
            {config?.telefono && <div style={styles.textoFiscal}>TEL: {config.telefono}</div>}
          </div>

          <div style={styles.separadorLineas} />

          {/* Datos del Comprobante */}
          <div style={styles.bloqueMetadatos}>
            <div style={styles.filaMeta}>
              <span style={styles.metaLabel}>CONTROL:</span>
              <strong style={styles.metaValor}>#{datos.correlativo || datos.id}</strong>
            </div>

            <div style={styles.filaMeta}>
              <span style={styles.metaLabel}>FECHA / HORA:</span>
              <span style={styles.metaValor}>{fechaFija}</span>
            </div>

            <div style={styles.filaMeta}>
              <span style={styles.metaLabel}>CAJERO / CAJA:</span>
              <span style={styles.metaValor}>{nombreCajero} · {nombreCaja}</span>
            </div>

            <div style={styles.filaMeta}>
              <span style={styles.metaLabel}>CLIENTE:</span>
              <strong style={styles.metaValor}>{cliente.nombre}</strong>
            </div>

            <div style={styles.filaMeta}>
              <span style={styles.metaLabel}>CÉDULA / RIF:</span>
              <strong style={styles.metaValor}>{cliente.doc}</strong>
            </div>

            {cliente.telefono && (
              <div style={styles.filaMeta}>
                <span style={styles.metaLabel}>TELÉFONO:</span>
                <span style={styles.metaValor}>{cliente.telefono}</span>
              </div>
            )}

            {/* Desglose de Forma de Pago */}
            <div style={styles.bloqueFormaPago}>
              <div style={styles.filaMeta}>
                <span style={styles.metaLabel}>FORMA DE PAGO:</span>
                <strong style={styles.metaValor}>
                  {datos.esCredito || datos.es_credito ? 'CUENTA POR COBRAR (CRÉDITO)' : (pagos.length > 1 ? 'PAGO MIXTO' : (datos.metodoPago || datos.metodos_pago?.[0]?.metodo || 'EFECTIVO'))}
                </strong>
              </div>

              {pagos.length > 1 && !datos.esCredito && !datos.es_credito && (
                <div style={styles.cajaDesgloseMixto}>
                  {pagos.map((p, i) => {
                    const esBolivares = (p.moneda === 'BS') || /bs|móvil|punto/i.test(p.metodo || '');
                    const montoTexto = esBolivares
                      ? `Bs. ${Number(p.montoBS || p.monto || (p.montoUSD ? p.montoUSD * tasa : 0)).toFixed(2)}`
                      : `$${Number(p.montoUSD || p.monto || 0).toFixed(2)}`;

                    return (
                      <div key={i} style={styles.itemFilaPago}>
                        <span style={styles.metodoItemNombre}>• {p.metodo}:</span>
                        <strong style={styles.metodoItemMonto}>{montoTexto}</strong>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div style={styles.separadorLineas} />

          {/* Cabecera de la Tabla */}
          <div style={styles.tablaHeader}>
            <span style={{ flex: 1.8, textAlign: 'left' }}>DESCRIPCIÓN</span>
            <span style={{ width: '56px', textAlign: 'center' }}>CANT/PESO</span>
            <span style={{ width: '46px', textAlign: 'right' }}>P.U</span>
            <span style={{ width: '54px', textAlign: 'right' }}>TOTAL</span>
          </div>

          <div style={styles.lineaFina} />

          {/* Renglones */}
          <div style={styles.listaProductos}>
            {items.map((it, idx) => {
              const cant = Number(it.cantidad || 0);
              const precio = Number(it.precioUSD ?? it.precio_usd ?? 0);
              const esRealmentePesado = Boolean(it.esPesado) || (cant % 1 !== 0);
              const esGravable = it.ivaTipo === '16' || it.iva === 16 || it.exentoIVA === false;

              return (
                <div key={idx} style={styles.itemFila}>
                  <div style={styles.colNombre}>
                    <span style={styles.nombreTexto}>{it.nombre}</span>
                    <span style={{
                      color: esGravable ? '#ea580c' : '#16a34a',
                      fontWeight: '700',
                      fontSize: '0.68rem',
                      marginLeft: '4px',
                      flexShrink: 0
                    }}>
                      {esGravable ? '(G)' : '(E)'}
                    </span>
                  </div>
                  <div style={styles.colCant}>
                    {esRealmentePesado ? `${cant.toFixed(3)}kg` : `${Math.round(cant)}`}
                  </div>
                  <div style={styles.colPu}>${precio.toFixed(2)}</div>
                  <div style={styles.colTotal}>${(precio * cant).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          <div style={styles.separadorLineas} />

          {/* Desglose de Totales */}
          <div style={styles.seccionDesglose}>
            {hayUnidades && (
              <div style={styles.filaSub}>
                <span>TOTAL ARTÍCULOS:</span>
                <strong>{totalPiezasUnid} unids</strong>
              </div>
            )}
            {hayPesados && (
              <div style={styles.filaSub}>
                <span>PESO TOTAL:</span>
                <strong>{totalPesoKg.toFixed(3)} KG</strong>
              </div>
            )}
            {subtotalExentoUSD > 0 && (
              <div style={styles.filaSub}>
                <span>SUBTOTAL EXENTO (E):</span>
                <strong>${subtotalExentoUSD.toFixed(2)}</strong>
              </div>
            )}
            {baseImponibleGravableUSD > 0 && (
              <>
                <div style={styles.filaSub}>
                  <span>BASE IMPONIBLE GRAVABLE (G):</span>
                  <strong>${baseImponibleGravableUSD.toFixed(2)}</strong>
                </div>
                <div style={{ ...styles.filaSub, color: '#ea580c' }}>
                  <span>IMPUESTO IVA (16%):</span>
                  <strong>+${impuestoIva16USD.toFixed(2)}</strong>
                </div>
              </>
            )}
          </div>

          {/* TOTALES EN DIVISA Y BOLÍVARES */}
          <div style={styles.bloqueTotales}>
            <div style={styles.filaGranTotalUSD}>
              <span>TOTAL FACTURA:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            <div style={styles.filaGranTotalBS}>
              <span>TOTAL BOLÍVARES:</span>
              <span>Bs. {totalBS.toFixed(2)}</span>
            </div>
            <div style={styles.notaTasaBCV}>
              TASA OFICIAL BCV: Bs. {tasa.toFixed(2)} / USD
            </div>
          </div>

          {/* Pie de Página y Código de Barras */}
          <div style={styles.bloquePie}>
            <div style={styles.mensajeAgradecimiento}>
              ¡Gracias por su compra! Revise su mercancía
            </div>
            <div style={styles.contenedorCodigoBarras}>
              <div style={styles.lineasCodigoBarras} />
              <div style={styles.codigoTexto}>* {datos.correlativo || datos.id} *</div>
            </div>
            <div style={styles.firmaCertificado}>
              <ShieldCheck size={12} color="#16a34a" /> Documento digital emitido por Facilito POS
            </div>
          </div>
        </div>

        {/* Acciones de Exportación (No se imprimen) */}
        <div style={styles.accionesFooter} className="no-imprimir">
          <button onClick={imprimir} style={styles.btnAccionImprimir}>
            <Printer size={15} /> Imprimir
          </button>
          <button onClick={compartirWhatsApp} style={styles.btnAccionWhatsApp}>
            <Share2 size={15} /> Enviar WhatsApp
          </button>
          <button onClick={alCerrar} style={styles.btnAccionListo}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    padding: '12px'
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    maxWidth: '420px',
    width: '100%',
    maxHeight: '94vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fff'
  },
  btnCerrar: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '6px'
  },
  ticketContainer: {
    padding: '16px 18px',
    overflowY: 'auto',
    backgroundColor: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '0.8rem',
    color: '#1e293b'
  },
  bloqueEncabezado: {
    textAlign: 'center',
    marginBottom: '8px'
  },
  nombreNegocio: {
    margin: '0 0 3px 0',
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: '-0.2px'
  },
  textoFiscal: {
    fontSize: '0.72rem',
    color: '#64748b',
    lineHeight: 1.3
  },
  separadorLineas: {
    borderBottom: '1px dashed #cbd5e1',
    margin: '10px 0'
  },
  lineaFina: {
    borderBottom: '1px solid #e2e8f0',
    margin: '4px 0 8px 0'
  },
  bloqueMetadatos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.74rem'
  },
  filaMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '8px'
  },
  metaLabel: {
    color: '#64748b',
    fontWeight: '500'
  },
  metaValor: {
    color: '#0f172a',
    textAlign: 'right'
  },
  bloqueFormaPago: {
    marginTop: '3px'
  },
  cajaDesgloseMixto: {
    backgroundColor: '#f8fafc',
    padding: '5px 8px',
    borderRadius: '6px',
    marginTop: '4px',
    border: '1px solid #f1f5f9'
  },
  itemFilaPago: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.7rem',
    margin: '2px 0'
  },
  metodoItemNombre: {
    color: '#64748b'
  },
  metodoItemMonto: {
    color: '#0f172a'
  },
  tablaHeader: {
    display: 'flex',
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#475569',
    padding: '2px 0'
  },
  listaProductos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '7px'
  },
  itemFila: {
    display: 'flex',
    alignItems: 'flex-start',
    fontSize: '0.74rem',
    lineHeight: 1.3
  },
  colNombre: {
    flex: 1.8,
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingRight: '6px'
  },
  nombreTexto: {
    wordBreak: 'break-word',
    color: '#0f172a',
    fontWeight: '500'
  },
  colCant: {
    width: '56px',
    textAlign: 'center',
    color: '#64748b'
  },
  colPu: {
    width: '46px',
    textAlign: 'right',
    color: '#64748b'
  },
  colTotal: {
    width: '54px',
    textAlign: 'right',
    fontWeight: '700',
    color: '#0f172a'
  },
  seccionDesglose: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '0.74rem',
    color: '#334155'
  },
  filaSub: {
    display: 'flex',
    justifyContent: 'space-between'
  },
  bloqueTotales: {
    marginTop: '10px',
    borderTop: '2px solid #0f172a',
    paddingTop: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '3px'
  },
  filaGranTotalUSD: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '1.08rem',
    fontWeight: '800',
    color: '#16a34a'
  },
  filaGranTotalBS: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.94rem',
    fontWeight: '700',
    color: '#0f2a4a'
  },
  notaTasaBCV: {
    textAlign: 'center',
    fontSize: '0.66rem',
    color: '#64748b',
    marginTop: '2px'
  },
  bloquePie: {
    textAlign: 'center',
    marginTop: '12px',
    paddingTop: '8px',
    borderTop: '1px dashed #cbd5e1'
  },
  mensajeAgradecimiento: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: '#334155',
    marginBottom: '6px'
  },
  contenedorCodigoBarras: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    margin: '4px 0'
  },
  lineasCodigoBarras: {
    width: '180px',
    height: '24px',
    backgroundImage: 'repeating-linear-gradient(90deg, #0f172a 0, #0f172a 2px, transparent 2px, transparent 4px, #0f172a 4px, #0f172a 7px, transparent 7px, transparent 9px)',
    backgroundSize: '100% 100%'
  },
  codigoTexto: {
    fontSize: '0.62rem',
    color: '#64748b',
    letterSpacing: '1px',
    fontFamily: 'monospace'
  },
  firmaCertificado: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    fontSize: '0.64rem',
    color: '#64748b',
    marginTop: '4px'
  },
  accionesFooter: {
    padding: '10px 14px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#fff',
    display: 'flex',
    gap: '8px'
  },
  btnAccionImprimir: {
    flex: 1,
    backgroundColor: '#0f2a4a',
    color: '#fff',
    border: 'none',
    padding: '9px 6px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  btnAccionWhatsApp: {
    flex: 1.3,
    backgroundColor: '#16a34a',
    color: '#fff',
    border: 'none',
    padding: '9px 6px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  btnAccionListo: {
    flex: 0.7,
    backgroundColor: '#f1f5f9',
    color: '#334155',
    border: 'none',
    padding: '9px 6px',
    borderRadius: '8px',
    fontSize: '0.76rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};
