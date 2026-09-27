import React from 'react';
import { X, Printer, Share2, Copy } from 'lucide-react';

export default function TicketModal({ ticket, configEmpresa, alCerrar }) {
  if (!ticket) return null;

  const tasaNum = parseFloat(ticket.tasaCambio) || parseFloat(ticket.tasa) || 1;
  const items = Array.isArray(ticket.items) ? ticket.items : [];

  let totalPiezas = 0;
  let totalKilos = 0;

  items.forEach(it => {
    if (it.esPesado) {
      totalKilos += (parseFloat(it.cantidad) || 0);
    } else {
      totalPiezas += (parseFloat(it.cantidad) || 0);
    }
  });

  const copiarTextoTicket = () => {
    let t = `*${configEmpresa.nombre}*\n`;
    t += `RIF: ${configEmpresa.rif}\n`;
    t += `Comprobante #${ticket.id}\n`;
    t += `Fecha: ${ticket.fecha}\n`;
    t += `Cajero: ${ticket.cajeroCobrador || 'Caja Principal'}\n`;
    t += `Cliente: ${ticket.cliente?.nombre || 'Consumidor Final'} (${ticket.cliente?.doc || 'V-00000000'})\n`;
    t += `Tasa BCV: Bs. ${tasaNum.toFixed(2)}/$\n`;
    t += `--------------------------------\n`;
    items.forEach(it => {
      const subUSD = (it.precioUSD * it.cantidad).toFixed(2);
      const cantTexto = it.esPesado ? `${it.cantidad} Kg` : `${it.cantidad} und`;
      t += `${it.nombre}\n  ${cantTexto} x $${parseFloat(it.precioUSD).toFixed(2)} = $${subUSD}\n`;
    });
    t += `--------------------------------\n`;
    if (parseFloat(ticket.descuentoUSD) > 0) {
      t += `Rebaja: -$${ticket.descuentoUSD}\n`;
    }
    t += `TOTAL A PAGAR: $${ticket.totalUSD}\n`;
    t += `TOTAL EN BS: Bs. ${ticket.totalBS}\n`;
    t += `--------------------------------\n`;
    t += `FORMAS DE COBRO:\n`;
    if (parseFloat(ticket.pagoUSD) > 0) t += `• Efectivo USD: $${parseFloat(ticket.pagoUSD).toFixed(2)}\n`;
    if (parseFloat(ticket.pagoBsEfectivo) > 0) t += `• Efectivo Bs: Bs. ${parseFloat(ticket.pagoBsEfectivo).toFixed(2)}\n`;
    if (parseFloat(ticket.pagoPM) > 0) t += `• Pago Móvil: Bs. ${parseFloat(ticket.pagoPM).toFixed(2)}\n`;
    if (parseFloat(ticket.pagoPunto) > 0) t += `• Punto de Venta: Bs. ${parseFloat(ticket.pagoPunto).toFixed(2)}\n`;
    if (parseFloat(ticket.vueltoUSD) > 0) t += `Vuelto: $${parseFloat(ticket.vueltoUSD).toFixed(2)}\n`;
    t += `--------------------------------\n`;
    t += `${configEmpresa.mensajePie || '¡Gracias por su compra!'}\n`;

    navigator.clipboard.writeText(t);
    alert('Ticket copiado al portapapeles.');
  };

  const compartirWhatsApp = () => {
    let tel = (ticket.cliente?.telefono || '').replace(/[^0-9]/g, '');
    if (tel.startsWith('0')) tel = '58' + tel.substring(1);

    let t = `🧾 *COMPROBANTE DE COMPRA #${ticket.id}*\n`;
    t += `*${configEmpresa.nombre}*\n`;
    t += `RIF: ${configEmpresa.rif}\n`;
    t += `Fecha: ${ticket.fecha}\n`;
    t += `Cliente: ${ticket.cliente?.nombre || 'Consumidor Final'}\n`;
    t += `--------------------------------\n`;
    items.forEach(it => {
      const cantTexto = it.esPesado ? `${it.cantidad} Kg` : `${it.cantidad} und`;
      t += `• *${it.nombre}* (${cantTexto}) = $${(it.precioUSD * it.cantidad).toFixed(2)}\n`;
    });
    t += `--------------------------------\n`;
    if (parseFloat(ticket.descuentoUSD) > 0) {
      t += `Rebaja aplicada: -$${ticket.descuentoUSD}\n`;
    }
    t += `*TOTAL A PAGAR: $${ticket.totalUSD}*\n`;
    t += `*TOTAL EN BS: Bs. ${ticket.totalBS}*\n`;
    t += `(Tasa BCV: Bs. ${tasaNum.toFixed(2)}/$)\n\n`;
    t += `${configEmpresa.mensajePie || '¡Gracias por su compra!'}`;

    const url = `https://wa.me/${tel}?text=${encodeURIComponent(t)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay} className="ticket-modal-overlay" translate="no">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .ticket-modal-overlay,
          .ticket-modal-overlay * {
            visibility: visible !important;
          }
          .ticket-modal-overlay {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            display: block !important;
          }
          .ticket-modal-card {
            box-shadow: none !important;
            border: none !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .ticket-papel-impresion {
            border: none !important;
            background: #fff !important;
            padding: 0 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 80mm !important;
            margin: 0 auto !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div style={styles.modalBox} className="ticket-modal-card">
        {/* HEADER DEL MODAL (OCULTO AL IMPRIMIR) */}
        <div style={styles.headerModal} className="no-print">
          <strong style={{ fontSize: '0.88rem', color: '#1e293b' }}>Comprobante de Compra</strong>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar} title="Cerrar"><X size={18} /></button>
        </div>

        {/* CONTENEDOR CON SCROLL */}
        <div style={styles.scrollArea}>
          <div style={styles.reciboModerno} className="ticket-papel-impresion">
            {/* LOGO DE LA EMPRESA */}
            {configEmpresa.logo && (
              <div style={styles.contenedorLogo}>
                <img src={configEmpresa.logo} alt="Logo" style={styles.logoTicket} />
              </div>
            )}

            {/* DATOS COMERCIO */}
            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>{configEmpresa.nombre}</h3>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>RIF: {configEmpresa.rif}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{configEmpresa.direccion}</div>
              {configEmpresa.telefono && <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Teléfono: {configEmpresa.telefono}</div>}
            </div>

            {/* METADATOS */}
            <div style={{ fontSize: '0.72rem', color: '#334155', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>COMPROBANTE:</span><strong>#{ticket.id}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FECHA / HORA:</span><span>{ticket.fecha}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CAJERO:</span><span>{ticket.cajeroCobrador || 'Caja Principal'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CLIENTE:</span><strong>{ticket.cliente?.nombre || 'Consumidor Final'}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>C.I. / RIF:</span><span>{ticket.cliente?.doc || 'V-00000000'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}><span>TASA BCV:</span><strong>Bs. {tasaNum.toFixed(2)} / $</strong></div>
            </div>

            {/* CABECERA */}
            <div style={{ display: 'flex', fontSize: '0.68rem', fontWeight: 'bold', color: '#64748b', borderBottom: '1px dashed #cbd5e1', paddingBottom: '4px', marginBottom: '6px' }}>
              <span style={{ flex: 2 }}>DESCRIPCIÓN</span>
              <span style={{ width: '65px', textAlign: 'center' }}>CANT</span>
              <span style={{ width: '65px', textAlign: 'right' }}>TOTAL</span>
            </div>

            {/* LISTA PRODUCTOS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
              {items.map((it, idx) => {
                const subUSD = (it.precioUSD * it.cantidad).toFixed(2);
                const subBS = (it.precioUSD * it.cantidad * tasaNum).toFixed(2);
                const cantTexto = it.esPesado ? `${it.cantidad} Kg` : `${it.cantidad}`;

                return (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <strong style={{ flex: 2, color: '#0f172a' }}>{it.nombre}</strong>
                      <span style={{ width: '65px', textAlign: 'center', fontWeight: 'bold', color: '#334155' }}>{cantTexto}</span>
                      <strong style={{ width: '65px', textAlign: 'right', color: '#0f172a' }}>${subUSD}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', marginTop: '1px' }}>
                      <span>${parseFloat(it.precioUSD).toFixed(2)}{it.esPesado ? '/Kg' : ' c/u'}</span>
                      <span>Bs. {subBS}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* TOTALES */}
            <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>CANTIDAD ARTÍCULOS:</span>
                <span>
                  {totalPiezas > 0 && `${totalPiezas} und. `}
                  {totalKilos > 0 && `${totalKilos.toFixed(3)} Kg`}
                </span>
              </div>

              {parseFloat(ticket.descuentoUSD) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 'bold', marginTop: '2px' }}>
                  <span>REBAJA / DESCUENTO:</span>
                  <span>-${ticket.descuentoUSD}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '900', color: '#0f172a', marginTop: '4px' }}>
                <span>TOTAL A PAGAR:</span>
                <span>${ticket.totalUSD}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.94rem', fontWeight: '900', color: '#0052cc' }}>
                <span>TOTAL EN BS:</span>
                <span>Bs. {ticket.totalBS}</span>
              </div>
            </div>

            {/* FORMA DE COBRO */}
            <div style={{ fontSize: '0.72rem', color: '#334155', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>MÉTODO DE PAGO:</div>
              {parseFloat(ticket.pagoUSD) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Efectivo Dólares ($):</span>
                  <span>${parseFloat(ticket.pagoUSD).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(ticket.pagoBsEfectivo) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Efectivo Bolívares:</span>
                  <span>Bs. {parseFloat(ticket.pagoBsEfectivo).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(ticket.pagoPM) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Pago Móvil:</span>
                  <span>Bs. {parseFloat(ticket.pagoPM).toFixed(2)}</span>
                </div>
              )}
              {parseFloat(ticket.pagoPunto) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>• Punto de Venta:</span>
                  <span>Bs. {parseFloat(ticket.pagoPunto).toFixed(2)}</span>
                </div>
              )}
              {ticket.esCredito && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626', fontWeight: 'bold' }}>
                  <span>• Saldo a Crédito:</span>
                  <span>${ticket.saldoDeudaUSD}</span>
                </div>
              )}
              {parseFloat(ticket.vueltoUSD) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 'bold', marginTop: '2px' }}>
                  <span>VUELTO ENTREGADO:</span>
                  <span>${parseFloat(ticket.vueltoUSD).toFixed(2)}</span>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '6px' }}>
              {configEmpresa.mensajePie || '¡Gracias por su compra! Revise su mercancía'}
            </div>
          </div>
        </div>

        {/* BOTONERA FIJA (NO SE IMPRIME) */}
        <div style={styles.footerAccionesFijas} className="no-print">
          <button type="button" onClick={compartirWhatsApp} style={styles.btnWhatsApp}>
            <Share2 size={15} /> WhatsApp
          </button>
          <button type="button" onClick={copiarTextoTicket} style={styles.btnCopiar}>
            <Copy size={15} /> Copiar
          </button>
          <button type="button" onClick={() => window.print()} style={styles.btnImprimir}>
            <Printer size={15} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modalBox: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '380px', maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModal: { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  reciboModerno: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  
  contenedorLogo: { textAlign: 'center', marginBottom: '6px' },
  logoTicket: { maxWidth: '75px', maxHeight: '60px', objectFit: 'contain', margin: '0 auto', display: 'block' },

  footerAccionesFijas: { padding: '10px 14px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', gap: '6px', flexShrink: 0 },
  btnWhatsApp: { flex: 1, backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 4px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  btnCopiar: { flex: 1, backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '11px 4px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' },
  btnImprimir: { flex: 1, backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', padding: '11px 4px', fontSize: '0.78rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }
};
