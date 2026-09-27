import React from 'react';
import { X, Printer, Share2, Copy, CheckCircle2 } from 'lucide-react';

export default function TicketCierreModal({ datosCierre, configEmpresa = {}, alCerrarDefinitivo, alCancelar }) {
  if (!datosCierre) return null;

  const {
    idCierre,
    fecha,
    responsable,
    tasaCambio,
    totalVentasUSD,
    totalVentasBS,
    cantVentas,
    entradasUSD,
    entradasBsEfectivo,
    entradasPM,
    entradasPunto,
    egresosUSD,
    egresosBsEfectivo,
    egresosPM,
    saldoFisicoUSD,
    saldoFisicoBS,
    saldoBancoNetoBs,
    gastosDetallados = []
  } = datosCierre;

  const tasaNum = Number(tasaCambio) || 1;

  const copiarTexto = () => {
    let t = `*${(configEmpresa.nombre || 'BODEGA POS').toUpperCase()}*\n`;
    t += `RIF: ${configEmpresa.rif || 'J-00000000-0'}\n`;
    t += `COMPROBANTE DE CIERRE DE CAJA (CORTE Z) #${idCierre}\n`;
    t += `Fecha: ${fecha}\n`;
    t += `Cajero / Responsable: ${responsable}\n`;
    t += `Tasa BCV: Bs. ${tasaNum.toFixed(2)}/$\n`;
    t += `================================\n`;
    t += `*VENTAS TOTALES DEL TURNO:*\n`;
    t += `• Total Divisa: $${totalVentasUSD.toFixed(2)}\n`;
    t += `• Total Bolívares: Bs. ${totalVentasBS.toFixed(2)}\n`;
    t += `• Transacciones: ${cantVentas}\n`;
    t += `--------------------------------\n`;
    t += `*EFECTIVO EN GAVETA FÍSICA:*\n`;
    t += `💵 *Dólares en Efectivo: $${saldoFisicoUSD.toFixed(2)}*\n`;
    t += `🇻🇪 *Bolívares en Efectivo: Bs. ${saldoFisicoBS.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*CUENTAS DIGITALES / BANCOS:*\n`;
    t += `• Pago Móvil Cobrado: Bs. ${entradasPM.toFixed(2)}\n`;
    t += `• Punto de Venta: Bs. ${entradasPunto.toFixed(2)}\n`;
    if (egresosPM > 0) t += `• Salidas por Pago Móvil: -Bs. ${egresosPM.toFixed(2)}\n`;
    t += `💳 *TOTAL NETO EN CUENTA: Bs. ${saldoBancoNetoBs.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*DETALLE DE EGRESOS / GASTOS (${gastosDetallados.length}):*\n`;
    if (gastosDetallados.length === 0) {
      t += `• Sin egresos registrados en el turno.\n`;
    } else {
      gastosDetallados.forEach(g => {
        const montoStr = (g.metodoSalida === 'USD' || g.moneda === 'USD') ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`;
        t += `• ${g.concepto} (${g.categoria || 'Gasto'}): -${montoStr}\n`;
        t += `   Hora: ${g.fecha} | Retiró: ${g.personaRetira || 'Caja'}${g.referencia ? ` | Ref: ${g.referencia}` : ''}\n`;
      });
      t += `• Total Salidas USD: -$${egresosUSD.toFixed(2)}\n`;
      t += `• Total Salidas Bs (Efec + PM): -Bs. ${(egresosBsEfectivo + egresosPM).toFixed(2)}\n`;
    }
    t += `================================\n`;
    t += `Arqueo conciliado y turno cerrado con éxito.\n`;

    navigator.clipboard.writeText(t);
    alert('Resumen de Cierre Z copiado.');
  };

  const compartirWhatsApp = () => {
    let t = `🧾 *COMPROBANTE DE CIERRE DE CAJA (CORTE Z) #${idCierre}*\n`;
    t += `*${configEmpresa.nombre || 'Mi Bodega POS'}*\n`;
    t += `Fecha: ${fecha}\n`;
    t += `Responsable: ${responsable}\n`;
    t += `Tasa BCV: Bs. ${tasaNum.toFixed(2)}/$\n`;
    t += `================================\n`;
    t += `*VENTAS TOTALES DEL TURNO:*\n`;
    t += `💵 *Total USD: $${totalVentasUSD.toFixed(2)}*\n`;
    t += `🇻🇪 *Total Bs: Bs. ${totalVentasBS.toFixed(2)}*\n`;
    t += `• Facturas emitidas: ${cantVentas}\n`;
    t += `--------------------------------\n`;
    t += `*EFECTIVO EN GAVETA FÍSICA:*\n`;
    t += `💵 *Dólares en Efectivo: $${saldoFisicoUSD.toFixed(2)}*\n`;
    t += `🇻🇪 *Bolívares en Efectivo: Bs. ${saldoFisicoBS.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*BANCOS Y PAGOS DIGITALES:*\n`;
    t += `• Pago Móvil Cobrado: Bs. ${entradasPM.toFixed(2)}\n`;
    t += `• Punto de Venta: Bs. ${entradasPunto.toFixed(2)}\n`;
    if (egresosPM > 0) t += `• Salidas por Pago Móvil: -Bs. ${egresosPM.toFixed(2)}\n`;
    t += `💳 *SALDO NETO EN CUENTA: Bs. ${saldoBancoNetoBs.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*DETALLE DE SALIDAS / GASTOS (${gastosDetallados.length}):*\n`;
    if (gastosDetallados.length === 0) {
      t += `• No hubo salidas de dinero.\n`;
    } else {
      gastosDetallados.forEach(g => {
        const montoStr = (g.metodoSalida === 'USD' || g.moneda === 'USD') ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`;
        t += `• ${g.concepto}: -${montoStr}\n`;
        t += `   Retiró: ${g.personaRetira || 'Caja'}${g.referencia ? ` (Ref: ${g.referencia})` : ''}\n`;
      });
      t += `Total Gastos USD: -$${egresosUSD.toFixed(2)}\n`;
      t += `Total Gastos Bs: -Bs. ${(egresosBsEfectivo + egresosPM).toFixed(2)}\n`;
    }
    t += `================================\n`;
    t += `¡Turno verificado y conciliado!`;

    const url = `https://wa.me/?text=${encodeURIComponent(t)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.overlay} className="ticket-cierre-overlay" translate="no">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .ticket-cierre-overlay, .ticket-cierre-overlay * { visibility: visible !important; }
          .ticket-cierre-overlay {
            position: absolute !important;
            left: 0 !important; top: 0 !important;
            width: 100% !important; background: #fff !important;
            padding: 0 !important; margin: 0 !important; display: block !important;
          }
          .ticket-cierre-card {
            box-shadow: none !important; border: none !important;
            max-width: 100% !important; width: 100% !important; padding: 0 !important;
          }
          .ticket-cierre-papel {
            border: none !important; background: #fff !important;
            padding: 0 !important; width: 100% !important; max-width: 80mm !important; margin: 0 auto !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={styles.modalBox} className="ticket-cierre-card">
        <div style={styles.headerModal} className="no-print">
          <div>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Comprobante de Cierre Z</strong>
            <small style={{ display: 'block', fontSize: '0.68rem', color: '#16a34a', fontWeight: 'bold' }}>Arqueo de Turno Generado</small>
          </div>
          <button type="button" onClick={alCancelar} style={styles.btnCerrarX}><X size={18} /></button>
        </div>

        <div style={styles.scrollArea}>
          <div style={styles.reciboModerno} className="ticket-cierre-papel">
            {configEmpresa.logo && (
              <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                <img src={configEmpresa.logo} alt="Logo" style={{ maxWidth: '75px', maxHeight: '60px', objectFit: 'contain' }} />
              </div>
            )}

            <div style={{ textAlign: 'center', borderBottom: '1px dashed #cbd5e1', paddingBottom: '8px', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>{configEmpresa.nombre || 'Mi Bodega POS'}</h3>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>RIF: {configEmpresa.rif || 'J-00000000-0'}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{configEmpresa.direccion}</div>
              <strong style={{ display: 'block', fontSize: '0.76rem', color: '#0f172a', marginTop: '4px' }}>
                REPORTE DE CORTE DE CAJA (Z) #{idCierre}
              </strong>
            </div>

            <div style={{ fontSize: '0.72rem', color: '#334155', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>FECHA / HORA:</span><span>{fecha}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>CAJERO:</span><strong>{responsable}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>TASA BCV:</span><strong>Bs. {tasaNum.toFixed(2)} / $</strong></div>
            </div>

            {/* VENTAS TOTALES */}
            <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '3px' }}>VENTAS TOTALES DEL TURNO:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Transacciones / Facturas:</span>
                <strong>{cantVentas}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: '900', color: '#0f172a', marginTop: '2px' }}>
                <span>TOTAL USD:</span>
                <span>${totalVentasUSD.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', fontWeight: '900', color: '#0052cc' }}>
                <span>TOTAL BS:</span>
                <span>Bs. {totalVentasBS.toFixed(2)}</span>
              </div>
            </div>

            {/* EFECTIVO EN GAVETA */}
            <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px', backgroundColor: '#f0fdf4', padding: '6px 8px', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: '3px' }}>EFECTIVO FÍSICO EN GAVETA:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Dólares Efectivo ($):</span>
                <strong style={{ color: '#047857' }}>${saldoFisicoUSD.toFixed(2)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Bolívares Efectivo (Bs):</span>
                <strong style={{ color: '#1e40af' }}>Bs. {saldoFisicoBS.toFixed(2)}</strong>
              </div>
            </div>

            {/* CUENTAS DIGITALES / BANCOS */}
            <div style={{ fontSize: '0.74rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '3px' }}>BANCOS Y MEDIOS DIGITALES:</div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Pago Móvil Recibido:</span>
                <span>Bs. {entradasPM.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>• Punto de Venta:</span>
                <span>Bs. {entradasPunto.toFixed(2)}</span>
              </div>
              {egresosPM > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                  <span>• Salidas por Pago Móvil:</span>
                  <span>-Bs. {egresosPM.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#0052cc', marginTop: '2px', borderTop: '1px dotted #cbd5e1', paddingTop: '2px' }}>
                <span>SALDO NETO EN CUENTA:</span>
                <span>Bs. {saldoBancoNetoBs.toFixed(2)}</span>
              </div>
            </div>

            {/* DETALLE DE EGRESOS */}
            <div style={{ fontSize: '0.72rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '6px', marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', color: '#b91c1c', marginBottom: '3px' }}>
                DETALLE DE SALIDAS / GASTOS ({gastosDetallados.length}):
              </div>
              {gastosDetallados.length === 0 ? (
                <div style={{ color: '#64748b', fontStyle: 'italic' }}>Sin egresos en este turno.</div>
              ) : (
                gastosDetallados.map((g, i) => (
                  <div key={i} style={{ marginBottom: '4px', borderBottom: '1px dotted #f1f5f9', paddingBottom: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong style={{ color: '#0f172a' }}>{g.concepto}</strong>
                      <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                        -{(g.metodoSalida === 'USD' || g.moneda === 'USD') ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>
                      Retiró: {g.personaRetira || 'Caja'}{g.metodoSalida === 'PAGO_MOVIL' ? ' (Pago Móvil)' : ''}{g.referencia ? ` | Ref: ${g.referencia}` : ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', marginTop: '6px' }}>
              *** FIN DEL REPORTE DE CIERRE Z ***
            </div>
          </div>
        </div>

        {/* BOTONERA FIJA */}
        <div style={styles.footerAccionesFijas} className="no-print">
          <button type="button" onClick={compartirWhatsApp} style={styles.btnWhatsApp}>
            <Share2 size={15} /> WhatsApp
          </button>
          <button type="button" onClick={copiarTexto} style={styles.btnCopiar}>
            <Copy size={15} /> Copiar
          </button>
          <button type="button" onClick={() => window.print()} style={styles.btnImprimir}>
            <Printer size={15} /> Imprimir Ticket
          </button>
          <button type="button" onClick={alCerrarDefinitivo} style={styles.btnFinalizarCierre}>
            <CheckCircle2 size={15} /> Finalizar Cierre
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '12px' },
  modalBox: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '390px', maxHeight: '94vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModal: { padding: '10px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '12px 14px' },
  reciboModerno: { backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' },
  
  footerAccionesFijas: { padding: '10px 12px', borderTop: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.2fr', gap: '4px', flexShrink: 0 },
  btnWhatsApp: { backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 2px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' },
  btnCopiar: { backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px 2px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' },
  btnImprimir: { backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 2px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' },
  btnFinalizarCierre: { backgroundColor: '#059669', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 2px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' }
};
