import React from 'react';
import { ArrowLeft, Printer, Share2, DollarSign, Banknote, Smartphone, CreditCard, ShoppingBag, RotateCcw, AlertTriangle, ArrowDownRight } from 'lucide-react';

export default function CajaModal({ transacciones, tasaCambio, alCerrarTurno, alVolver }) {
  const tasa = parseFloat(tasaCambio) || 1;

  const ventasActivas = transacciones.filter(t => t.tipo === 'venta' && !t.anulada);
  const ventasAnuladas = transacciones.filter(t => t.tipo === 'venta' && t.anulada);
  const abonos = transacciones.filter(t => t.tipo === 'abono');

  let efectivoUSD_Recibido = 0;
  let efectivoBS_Recibido = 0;
  let pmBS_Recibido = 0;
  let puntoBS_Recibido = 0;
  let creditosNuevosUSD = 0;
  let totalVentasBrutasUSD = 0;
  let totalVueltosBS = 0;
  let totalVueltosUSD = 0;

  ventasActivas.forEach(v => {
    efectivoUSD_Recibido += parseFloat(v.pagoUSD) || 0;
    efectivoBS_Recibido += parseFloat(v.pagoBsEfectivo) || 0;
    pmBS_Recibido += parseFloat(v.pagoPM) || 0;
    puntoBS_Recibido += parseFloat(v.pagoPunto) || 0;
    totalVentasBrutasUSD += parseFloat(v.totalUSD) || 0;

    totalVueltosBS += parseFloat(v.vueltoBS) || 0;
    totalVueltosUSD += parseFloat(v.vueltoUSD) || 0;

    if (v.esCredito) creditosNuevosUSD += parseFloat(v.saldoDeudaUSD) || 0;
  });

  let abonosUSD = 0;
  let abonosBsEfectivo = 0;
  let abonosPM = 0;
  let abonosPunto = 0;

  abonos.forEach(a => {
    abonosUSD += parseFloat(a.pagoUSD) || 0;
    abonosBsEfectivo += parseFloat(a.pagoBsEfectivo) || 0;
    abonosPM += parseFloat(a.pagoPM) || 0;
    abonosPunto += parseFloat(a.pagoPunto) || 0;
  });

  // FONDOS FÍSICOS EN GAVETA
  // Si se dio vuelto en Bs y había efectivo en Bs, se descuenta de ahí:
  let efectivoBS_Neto = (efectivoBS_Recibido + abonosBsEfectivo) - totalVueltosBS;
  let deduccionEnUSD = 0;
  if (efectivoBS_Neto < 0) {
    deduccionEnUSD = Math.abs(efectivoBS_Neto) / tasa;
    efectivoBS_Neto = 0;
  }

  const efectivoUSD_Neto = Math.max(0, (efectivoUSD_Recibido + abonosUSD) - deduccionEnUSD);

  // FONDOS ELECTRÓNICOS EN BANCO
  const bancoPM_BS = pmBS_Recibido + abonosPM;
  const bancoPunto_BS = puntoBS_Recibido + abonosPunto;
  const totalBancoBS = bancoPM_BS + bancoPunto_BS;

  // Gran Total Cuadre Neto Disponible (Efectivo $ + Efectivo Bs + Bancos Bs convertidos a tasa)
  const totalCajaUSD = efectivoUSD_Neto + ((efectivoBS_Neto + totalBancoBS) / tasa);

  const compartirCierreWhatsApp = () => {
    let t = "*CIERRE DE CAJA (CORTE Z)*\n";
    t += "COMERCIALIZADORA POS\n";
    t += `Fecha: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}\n`;
    t += `Tasa Oficial: Bs. ${tasa.toFixed(2)}\n`;
    t += "--------------------------------\n";
    t += `• Facturas Emitidas:  ${ventasActivas.length}\n`;
    t += `• Facturas Anuladas:  ${ventasAnuladas.length}\n`;
    t += `• Abonos Cobrados:    ${abonos.length}\n`;
    t += `• Venta Bruta Total:  $${totalVentasBrutasUSD.toFixed(2)}\n`;
    if (totalVueltosUSD > 0) {
      t += `• Vueltos Entregados: -$${totalVueltosUSD.toFixed(2)} (Bs. ${totalVueltosBS.toFixed(2)})\n`;
    }
    t += `• Crédito Otorgado:   $${creditosNuevosUSD.toFixed(2)}\n`;
    t += "--------------------------------\n";
    t += "*FONDOS EN GAVETA (FÍSICO)*\n";
    t += `💵 Efectivo Divisas:  $${efectivoUSD_Neto.toFixed(2)}\n`;
    t += `🇻🇪 Efectivo Bolívares: Bs. ${efectivoBS_Neto.toFixed(2)}\n`;
    t += "--------------------------------\n";
    t += "*FONDOS EN BANCO (ELECTRÓNICO)*\n";
    t += `📲 Pago Móvil:        Bs. ${bancoPM_BS.toFixed(2)}\n`;
    t += `💳 Punto de Venta:    Bs. ${bancoPunto_BS.toFixed(2)}\n`;
    t += `🏛️ Total Banco Bs:    Bs. ${totalBancoBS.toFixed(2)}\n`;
    t += "--------------------------------\n";
    t += `*BALANCE GENERAL NETO: $${totalCajaUSD.toFixed(2)}*\n`;
    t += "--------------------------------\n";
    t += "Reporte generado por Sistema POS.";

    const b = String.fromCharCode(96, 96, 96);
    const msg = b + "\n" + t + b;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const ejecutarCierre = () => {
    if (confirm('¿Cerrar el turno de caja ahora? Se reseteará el balance para el nuevo turno.')) {
      alCerrarTurno();
      alert('Caja cerrada con éxito.');
      alVolver();
    }
  };

  return (
    <div style={styles.contenedor} translate="no">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack}><ArrowLeft color="#333" size={20} /></button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>Cuadre y Cierre de Caja</h2>
            <small style={{ color: '#666', fontSize: '0.72rem' }}>Corte Z del Turno</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button type="button" onClick={compartirCierreWhatsApp} style={{ ...styles.btnHeaderTool, backgroundColor: '#25d366', color: '#fff' }}><Share2 size={16} /></button>
          <button type="button" onClick={() => window.print()} style={{ ...styles.btnHeaderTool, backgroundColor: '#0052cc', color: '#fff' }}><Printer size={16} /></button>
        </div>
      </header>

      <div style={styles.scrollArea}>
        {/* BANNER BALANCE GENERAL */}
        <div style={styles.cardBalance}>
          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: '600' }}>TOTAL NETO EN CAJA (DISPONIBLE)</span>
          <div style={styles.montoPrincipal}>${totalCajaUSD.toFixed(2)}</div>
          <span style={{ fontSize: '0.72rem', color: '#0052cc', fontWeight: 'bold' }}>
            Equivalente: Bs. {(totalCajaUSD * tasa).toFixed(2)} (Tasa: {tasa.toFixed(2)})
          </span>
        </div>

        {/* FONDOS EN GAVETA (FÍSICOS) */}
        <div style={styles.seccionTitulo}>FONDOS EN GAVETA (FÍSICO EN MANO)</div>
        <div style={styles.gridFondos}>
          <div style={styles.cardFondo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.iconoFondo, backgroundColor: '#dcfce7', color: '#16a34a' }}><DollarSign size={18} /></div>
              <div>
                <div style={styles.tituloFondo}>Efectivo Divisas</div>
                <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Billetes $</small>
              </div>
            </div>
            <div style={{ ...styles.montoFondo, color: '#16a34a' }}>${efectivoUSD_Neto.toFixed(2)}</div>
          </div>

          <div style={styles.cardFondo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.iconoFondo, backgroundColor: '#ecfdf5', color: '#059669' }}><Banknote size={18} /></div>
              <div>
                <div style={styles.tituloFondo}>Efectivo Bolívares</div>
                <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Billetes Bs en gaveta</small>
              </div>
            </div>
            <div style={{ ...styles.montoFondo, color: '#059669' }}>Bs. {efectivoBS_Neto.toFixed(2)}</div>
          </div>
        </div>

        {/* FONDOS BANCARIOS (ELECTRÓNICOS) */}
        <div style={styles.seccionTitulo}>FONDOS BANCARIOS (DIGITAL)</div>
        <div style={styles.gridFondos}>
          <div style={styles.cardFondo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.iconoFondo, backgroundColor: '#e0f2fe', color: '#0284c7' }}><Smartphone size={18} /></div>
              <div>
                <div style={styles.tituloFondo}>Pago Móvil</div>
                <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Banco Bs</small>
              </div>
            </div>
            <div style={{ ...styles.montoFondo, color: '#0284c7' }}>Bs. {bancoPM_BS.toFixed(2)}</div>
          </div>

          <div style={styles.cardFondo}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ ...styles.iconoFondo, backgroundColor: '#f3e8ff', color: '#9333ea' }}><CreditCard size={18} /></div>
              <div>
                <div style={styles.tituloFondo}>Punto de Venta</div>
                <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Banco Bs</small>
              </div>
            </div>
            <div style={{ ...styles.montoFondo, color: '#9333ea' }}>Bs. {bancoPunto_BS.toFixed(2)}</div>
          </div>
        </div>

        {/* AUDITORÍA Y VUELTOS */}
        <div style={styles.seccionTitulo}>AUDITORÍA DEL TURNO</div>
        <div style={styles.cardResumen}>
          <div style={styles.filaDato}>
            <span style={styles.labelDato}><ShoppingBag size={14} color="#64748b" /> Facturas Emitidas:</span>
            <strong>{ventasActivas.length}</strong>
          </div>
          <div style={styles.filaDato}>
            <span style={styles.labelDato}><AlertTriangle size={14} color="#ef4444" /> Facturas Anuladas:</span>
            <strong style={{ color: ventasAnuladas.length > 0 ? '#ef4444' : '#64748b' }}>{ventasAnuladas.length}</strong>
          </div>
          <div style={styles.filaDato}>
            <span style={styles.labelDato}>Abonos Cobrados:</span>
            <strong>{abonos.length}</strong>
          </div>
          
          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }} />
          
          <div style={styles.filaDato}>
            <span style={styles.labelDato}>Venta Bruta Total:</span>
            <strong style={{ color: '#0f172a' }}>${totalVentasBrutasUSD.toFixed(2)}</strong>
          </div>

          {totalVueltosUSD > 0 && (
            <div style={{ ...styles.filaDato, backgroundColor: '#fff1f2', padding: '4px 6px', borderRadius: '6px' }}>
              <span style={{ ...styles.labelDato, color: '#e11d48', fontWeight: 'bold' }}>
                <ArrowDownRight size={14} /> Vueltos Deducidos:
              </span>
              <strong style={{ color: '#e11d48' }}>
                -${totalVueltosUSD.toFixed(2)} (Bs. {totalVueltosBS.toFixed(2)})
              </strong>
            </div>
          )}

          <div style={styles.filaDato}>
            <span style={styles.labelDato}>Crédito Otorgado (Fiado):</span>
            <strong style={{ color: '#ea580c' }}>${creditosNuevosUSD.toFixed(2)}</strong>
          </div>
        </div>

        <div style={styles.seccionBotonFinal}>
          <button type="button" onClick={ejecutarCierre} style={styles.btnCerrarTurno}>
            <RotateCcw size={16} /> Cerrar Turno (Corte Z)
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '12px 16px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnHeaderTool: { border: 'none', width: '34px', height: '34px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '14px 16px 95px 16px', WebkitOverflowScrolling: 'touch' },
  cardBalance: { backgroundColor: '#fff', borderRadius: '12px', padding: '16px', textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.03)', marginBottom: '14px' },
  montoPrincipal: { fontSize: '1.9rem', fontWeight: '900', color: '#0f172a', margin: '4px 0' },
  seccionTitulo: { fontSize: '0.72rem', fontWeight: 'bold', color: '#64748b', letterSpacing: '0.5px', marginBottom: '8px', textTransform: 'uppercase' },
  gridFondos: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' },
  cardFondo: { backgroundColor: '#fff', borderRadius: '10px', padding: '10px 14px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  iconoFondo: { width: '34px', height: '34px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  tituloFondo: { fontSize: '0.82rem', fontWeight: 'bold', color: '#1e293b' },
  montoFondo: { fontSize: '0.95rem', fontWeight: 'bold' },
  cardResumen: { backgroundColor: '#fff', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' },
  filaDato: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' },
  labelDato: { display: 'flex', alignItems: 'center', gap: '6px', color: '#475569' },
  seccionBotonFinal: { marginTop: '20px', paddingBottom: '30px' },
  btnCerrarTurno: { width: '100%', padding: '13px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)' }
};
