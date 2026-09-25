import React, { useRef } from 'react';
import { X, Printer, Share2, Copy } from 'lucide-react';

export default function TicketModal({ ticket, configEmpresa, alCerrar }) {
  const ticketRef = useRef(null);

  if (!ticket) return null;

  const esAnulada = Boolean(ticket.anulada);
  const tasa = parseFloat(ticket.tasa) || 1;
  const cfg = configEmpresa || {
    nombre: 'Mi Bodega POS',
    rif: 'J-50000000-0',
    direccion: 'Caracas, Venezuela',
    telefono: '0412-0000000',
    mensajePie: '¡Gracias por su compra! Revise su mercancía',
    logo: ''
  };

  const totalArticulos = (ticket.items || []).reduce((acc, it) => acc + (parseFloat(it.cantidad) || 0), 0);
  const tieneDescuento = parseFloat(ticket.descuentoUSD) > 0.009;

  const imprimir = () => {
    window.print();
  };

  const copiarPortapapeles = () => {
    let t = "";
    if (esAnulada) {
      t += "================================\n";
      t += "   *** DOCUMENTO ANULADO *** \n";
      t += "================================\n";
    }
    t += `     ${cfg.nombre.toUpperCase()}     \n`;
    t += `       RIF: ${cfg.rif}        \n`;
    t += `      Tlf: ${cfg.telefono}      \n`;
    t += `    ${cfg.direccion}       \n`;
    t += "--------------------------------\n";
    t += `COMPROBANTE: #${ticket.id}\n`;
    t += `FECHA/HORA:  ${ticket.fecha}\n`;
    t += `CAJERO:      Caja Principal 01\n`;
    t += `CLIENTE:     ${ticket.cliente?.nombre || 'Consumidor Final'}\n`;
    t += `C.I./RIF:    ${ticket.cliente?.doc || 'V-00000000'}\n`;
    if (ticket.cliente?.telefono) t += `TELÉFONO:    ${ticket.cliente.telefono}\n`;
    t += `TASA OFICIAL: Bs. ${tasa.toFixed(2)}\n`;
    t += "--------------------------------\n";
    t += "CANT  DESCRIPCIÓN       TOTAL\n";
    t += "--------------------------------\n";
    (ticket.items || []).forEach(it => {
      const totUSD = (it.precioUSD * it.cantidad).toFixed(2);
      const totBS = ((it.precioUSD * it.cantidad) * tasa).toFixed(2);
      t += `${it.cantidad}x ${it.nombre}\n`;
      t += `   P.U: $${it.precioUSD.toFixed(2)}  = $${totUSD} (Bs.${totBS})\n`;
    });
    t += "--------------------------------\n";
    t += `TOTAL PIEZAS: ${totalArticulos}\n`;
    if (tieneDescuento) {
      t += `SUBTOTAL:     $${ticket.subtotalUSD || ticket.totalUSD}\n`;
      t += `DESCUENTO:   -$${ticket.descuentoUSD} (${ticket.descuentoTexto || 'Promo'})\n`;
    }
    t += `TOTAL USD:    $${ticket.totalUSD}\n`;
    t += `TOTAL BS:     Bs. ${ticket.totalBS}\n`;
    t += "--------------------------------\n";
    if (ticket.esCredito) {
      t += "FORMA DE PAGO: CRÉDITO PENDIENTE\n";
      t += `SALDO ADEUDADO: $${ticket.saldoDeudaUSD} (Bs. ${ticket.saldoDeudaBS})\n`;
    } else {
      t += "DESGLOSE DE PAGO:\n";
      if (parseFloat(ticket.pagoUSD) > 0) t += `• Divisas $:       $${ticket.pagoUSD}\n`;
      if (parseFloat(ticket.pagoBsEfectivo) > 0) t += `• Efectivo Bs:     Bs. ${ticket.pagoBsEfectivo}\n`;
      if (parseFloat(ticket.pagoPM) > 0) t += `• Pago Móvil:      Bs. ${ticket.pagoPM}\n`;
      if (parseFloat(ticket.pagoPunto) > 0) t += `• Punto de Venta:  Bs. ${ticket.pagoPunto}\n`;
      if (parseFloat(ticket.vueltoBS) > 0) {
        t += `• Vuelto Entregado: Bs. ${ticket.vueltoBS} ($${ticket.vueltoUSD})\n`;
      }
    }
    t += "--------------------------------\n";
    t += esAnulada ? "ESTA FACTURA FUE ANULADA EN SISTEMA\n" : `${cfg.mensajePie}\n`;

    navigator.clipboard.writeText(t).then(() => {
      alert('Ticket copiado al portapapeles.');
    }).catch(() => {});
  };

  const compartirWhatsApp = () => {
    let t = "";
    if (esAnulada) t += "🚫 *FACTURA ANULADA - SIN VALIDEZ* 🚫\n\n";
    t += `*${cfg.nombre.toUpperCase()}*\n`;
    t += `*RIF:* ${cfg.rif} | *Tlf:* ${cfg.telefono}\n`;
    t += `*Ticket:* #${ticket.id}\n`;
    t += `*Fecha:* ${ticket.fecha}\n`;
    t += `*Cliente:* ${ticket.cliente?.nombre || 'Consumidor Final'} (${ticket.cliente?.doc || 'V-00000000'})\n`;
    t += `*Tasa Oficial:* Bs. ${tasa.toFixed(2)}\n`;
    t += "--------------------------------\n";
    (ticket.items || []).forEach(it => {
      const totUSD = (it.precioUSD * it.cantidad).toFixed(2);
      t += `• ${it.cantidad}x ${it.nombre} = $${totUSD}\n`;
    });
    t += "--------------------------------\n";
    if (tieneDescuento) {
      t += `Subtotal: $${ticket.subtotalUSD || ticket.totalUSD}\n`;
      t += `Descuento Aplicado: -$${ticket.descuentoUSD} (${ticket.descuentoTexto || 'Rebaja'})\n`;
    }
    t += `*TOTAL COMPRA: $${ticket.totalUSD} (Bs. ${ticket.totalBS})*\n`;
    if (ticket.esCredito) {
      t += `*Condición:* CRÉDITO PENDIENTE\n`;
      t += `*Saldo pendiente:* $${ticket.saldoDeudaUSD} (Bs. ${ticket.saldoDeudaBS})\n`;
    }
    t += esAnulada ? "\n⚠️ Operación anulada sin validez fiscal." : `\n${cfg.mensajePie}`;

    const b = String.fromCharCode(96, 96, 96);
    const msg = b + "\n" + t + b;
    const tel = (ticket.cliente?.telefono || '').replace(/[^0-9]/g, '');
    const url = tel ? `https://wa.me/${tel}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modal}>
        <div style={styles.topBar}>
          <span style={styles.tituloVentana}>{esAnulada ? 'Ticket Anulado' : 'Ticket de Compra'}</span>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar}><X size={18} /></button>
        </div>

        <div style={styles.scrollTicket}>
          <div ref={ticketRef} style={{ ...styles.papel, borderColor: esAnulada ? '#ef9a9a' : '#e2e8f0' }}>
            
            {esAnulada && (
              <div style={styles.watermarkContainer}>
                <div style={styles.watermark}>ANULADO</div>
              </div>
            )}

            {esAnulada && (
              <div style={styles.alertaAnulada}>
                VENTA ANULADA - SIN VALOR
              </div>
            )}

            <div style={styles.encabezado}>
              {cfg.logo && (
                <div style={{ marginBottom: '6px' }}>
                  <img src={cfg.logo} alt="Logo" style={{ maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
                </div>
              )}
              <h2 style={styles.nombreComercio}>{cfg.nombre}</h2>
              <div style={styles.datosComercio}>RIF: {cfg.rif}</div>
              <div style={styles.datosComercio}>{cfg.direccion}</div>
              <div style={styles.datosComercio}>Teléfono: {cfg.telefono}</div>
            </div>

            <div style={styles.lineaGris} />

            <div style={styles.bloqueMeta}>
              <div style={styles.metaRow}><span>COMPROBANTE:</span> <strong>#{ticket.id}</strong></div>
              <div style={styles.metaRow}><span>FECHA / HORA:</span> <span>{ticket.fecha}</span></div>
              <div style={styles.metaRow}><span>CAJERO / CAJA:</span> <span>Caja 01 - Principal</span></div>
              <div style={styles.metaRow}><span>CLIENTE:</span> <strong>{ticket.cliente?.nombre || 'Consumidor Final'}</strong></div>
              <div style={styles.metaRow}><span>C.I. / RIF:</span> <span>{ticket.cliente?.doc || 'V-00000000'}</span></div>
              {ticket.cliente?.telefono && (
                <div style={styles.metaRow}><span>TELÉFONO:</span> <span>{ticket.cliente.telefono}</span></div>
              )}
              <div style={styles.metaRow}><span>TASA CAMBIO:</span> <strong>Bs. {tasa.toFixed(2)} / $</strong></div>
            </div>

            <div style={styles.lineaGris} />

            <div style={styles.tablaHeader}>
              <span style={{ flex: 3.2 }}>DESCRIPCIÓN</span>
              <span style={{ flex: 0.8, textAlign: 'center' }}>CANT</span>
              <span style={{ flex: 1.6, textAlign: 'right' }}>TOTAL</span>
            </div>

            <div style={styles.itemsLista}>
              {(ticket.items || []).map((it, idx) => {
                const subUSD = it.precioUSD * it.cantidad;
                const subBS = subUSD * tasa;
                return (
                  <div key={idx} style={styles.itemRow}>
                    <div style={{ flex: 3.2, paddingRight: '4px' }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{it.nombre}</div>
                      <div style={{ fontSize: '0.67rem', color: '#64748b' }}>
                        ${it.precioUSD.toFixed(2)} (Bs. {(it.precioUSD * tasa).toFixed(2)}) c/u
                      </div>
                    </div>
                    <div style={{ flex: 0.8, textAlign: 'center', fontWeight: 'bold' }}>{it.cantidad}</div>
                    <div style={{ flex: 1.6, textAlign: 'right' }}>
                      <div style={{ fontWeight: 'bold', color: '#0f172a' }}>${subUSD.toFixed(2)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Bs.{subBS.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={styles.lineaPunteada} />

            <div style={styles.seccionTotales}>
              <div style={styles.metaRow}>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>CANTIDAD ARTÍCULOS:</span>
                <strong style={{ fontSize: '0.78rem' }}>{totalArticulos} und.</strong>
              </div>

              {tieneDescuento && (
                <>
                  <div style={styles.metaRow}>
                    <span style={{ fontSize: '0.74rem', color: '#64748b' }}>SUBTOTAL VENTA:</span>
                    <strong style={{ fontSize: '0.84rem', color: '#475569' }}>${ticket.subtotalUSD || ticket.totalUSD}</strong>
                  </div>
                  <div style={{ ...styles.metaRow, color: '#e11d48', fontWeight: 'bold' }}>
                    <span style={{ fontSize: '0.74rem' }}>DESCUENTO ({ticket.descuentoTexto || 'Rebaja'}):</span>
                    <span style={{ fontSize: '0.84rem' }}>-${ticket.descuentoUSD}</span>
                  </div>
                </>
              )}

              <div style={styles.filaTotalUSD}>
                <span>TOTAL A PAGAR:</span>
                <span style={{ textDecoration: esAnulada ? 'line-through' : 'none' }}>${ticket.totalUSD}</span>
              </div>
              <div style={styles.filaTotalBS}>
                <span>TOTAL EN BS:</span>
                <span style={{ textDecoration: esAnulada ? 'line-through' : 'none' }}>Bs. {ticket.totalBS}</span>
              </div>
            </div>

            <div style={styles.lineaGris} />

            <div style={styles.seccionPagos}>
              <div style={{ fontSize: '0.68rem', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>MÉTODO DE PAGO:</div>
              {ticket.esCredito ? (
                <div style={styles.creditoBadge}>
                  <div style={{ fontWeight: 'bold' }}>VENTA A CRÉDITO (FIADO)</div>
                  <div style={{ fontSize: '0.72rem', marginTop: '2px' }}>Saldo por cobrar: ${ticket.saldoDeudaUSD} (Bs. {ticket.saldoDeudaBS})</div>
                </div>
              ) : (
                <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {parseFloat(ticket.pagoUSD) > 0 && (
                    <div style={styles.metaRow}><span>• Divisas ($):</span> <strong>${ticket.pagoUSD}</strong></div>
                  )}
                  {parseFloat(ticket.pagoBsEfectivo) > 0 && (
                    <div style={styles.metaRow}><span>• Efectivo (Bs):</span> <strong>Bs. {ticket.pagoBsEfectivo}</strong></div>
                  )}
                  {parseFloat(ticket.pagoPM) > 0 && (
                    <div style={styles.metaRow}><span>• Pago Móvil:</span> <strong>Bs. {ticket.pagoPM}</strong></div>
                  )}
                  {parseFloat(ticket.pagoPunto) > 0 && (
                    <div style={styles.metaRow}><span>• Punto de Venta:</span> <strong>Bs. {ticket.pagoPunto}</strong></div>
                  )}
                  {parseFloat(ticket.vueltoBS) > 0 && (
                    <div style={{ ...styles.metaRow, color: '#0052cc', fontWeight: 'bold', borderTop: '1px dotted #cbd5e1', paddingTop: '3px', marginTop: '2px' }}>
                      <span>• Vuelto al Cliente:</span> <span>Bs. {ticket.vueltoBS} (${ticket.vueltoUSD})</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={styles.pieMensaje}>
              {esAnulada ? (
                <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>*** TRANSACCIÓN ANULADA EN AUDITORÍA ***</span>
              ) : (
                <>
                  <div>{cfg.mensajePie}</div>
                  <div style={{ fontSize: '0.62rem', color: '#94a3b8', marginTop: '2px' }}>Conserve este ticket para reclamos</div>
                </>
              )}
            </div>

          </div>
        </div>

        <div style={styles.footerAcciones}>
          <button type="button" onClick={compartirWhatsApp} style={{ ...styles.btnFoot, backgroundColor: '#25d366', color: '#fff' }}>
            <Share2 size={15} /> WhatsApp
          </button>
          <button type="button" onClick={copiarPortapapeles} style={{ ...styles.btnFoot, backgroundColor: '#f1f5f9', color: '#334155' }}>
            <Copy size={15} /> Copiar
          </button>
          <button type="button" onClick={imprimir} style={{ ...styles.btnFoot, backgroundColor: '#0052cc', color: '#fff' }}>
            <Printer size={15} /> Imprimir
          </button>
        </div>

      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modal: { backgroundColor: '#fff', borderRadius: '16px', width: '100%', maxWidth: '370px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)', overflow: 'hidden' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #f1f5f9' },
  tituloVentana: { fontSize: '0.88rem', fontWeight: 'bold', color: '#1e293b' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  scrollTicket: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  papel: { position: 'relative', backgroundColor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px 12px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', overflow: 'hidden' },
  watermarkContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 5 },
  watermark: { border: '3px solid rgba(239, 68, 68, 0.35)', color: 'rgba(239, 68, 68, 0.35)', fontSize: '2.2rem', fontWeight: '900', padding: '4px 14px', transform: 'rotate(-25deg)', borderRadius: '8px', letterSpacing: '5px' },
  alertaAnulada: { backgroundColor: '#fee2e2', color: '#991b1b', textAlign: 'center', padding: '4px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 'bold', marginBottom: '8px', border: '1px solid #fecaca' },
  encabezado: { textAlign: 'center', marginBottom: '6px' },
  nombreComercio: { margin: 0, fontSize: '0.92rem', fontWeight: '800', color: '#0f172a' },
  datosComercio: { fontSize: '0.68rem', color: '#64748b', marginTop: '1px' },
  lineaGris: { height: '1px', backgroundColor: '#e2e8f0', margin: '8px 0' },
  lineaPunteada: { borderTop: '1px dashed #cbd5e1', margin: '8px 0' },
  bloqueMeta: { fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '2px' },
  metaRow: { display: 'flex', justifyContent: 'space-between', color: '#334155' },
  tablaHeader: { display: 'flex', fontSize: '0.67rem', fontWeight: 'bold', color: '#64748b', paddingBottom: '3px', borderBottom: '1px solid #e2e8f0' },
  itemsLista: { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' },
  itemRow: { display: 'flex', alignItems: 'flex-start', fontSize: '0.73rem' },
  seccionTotales: { display: 'flex', flexDirection: 'column', gap: '3px', padding: '2px 0' },
  filaTotalUSD: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.02rem', fontWeight: '900', color: '#0f172a' },
  filaTotalBS: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: 'bold', color: '#0052cc' },
  seccionPagos: { padding: '2px 0' },
  creditoBadge: { backgroundColor: '#fff7ed', color: '#c2410c', padding: '6px 8px', borderRadius: '6px', fontSize: '0.73rem', textAlign: 'center', border: '1px solid #ffedd5' },
  pieMensaje: { textAlign: 'center', fontSize: '0.68rem', color: '#475569', marginTop: '10px', fontWeight: '600' },
  footerAcciones: { display: 'flex', gap: '6px', padding: '10px 14px', borderTop: '1px solid #f1f5f9' },
  btnFoot: { flex: 1, border: 'none', padding: '9px 4px', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }
};
