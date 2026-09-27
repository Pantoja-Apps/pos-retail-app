import React, { useState } from 'react';
import { 
  ArrowLeft, Wallet, TrendingDown, Plus, Trash2, Printer, 
  Share2, CheckCircle2, DollarSign, Smartphone, Receipt, CreditCard, X, Landmark, TrendingUp
} from 'lucide-react';
import TicketCierreModal from './TicketCierreModal';

export default function CajaModal(props) {
  const {
    transacciones = [],
    gastos = [],
    tasaCambio = 1,
    configEmpresa = {},
    alRegistrarGasto = () => {},
    alEliminarGasto = () => {},
    alCerrarTurno = () => {},
    alVolver = () => {},
    usuarioActivo = {}
  } = props;

  const [tabActual, setTabActual] = useState('cuadre');
  const [modalGastoAbierto, setModalGastoAbierto] = useState(false);
  const [datosCierreParaTicket, setDatosCierreParaTicket] = useState(null);

  const [concepto, setConcepto] = useState('');
  const [categoria, setCategoria] = useState('Proveedores');
  const [metodoSalida, setMetodoSalida] = useState('USD');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [personaRetira, setPersonaRetira] = useState('');

  const tasaNum = Number(tasaCambio) || 1;
  const listaTx = Array.isArray(transacciones) ? transacciones.filter(t => t && !t.anulada) : [];
  const listaGastos = Array.isArray(gastos) ? gastos.filter(Boolean) : [];

  let entradasUSD = 0;
  let entradasBsEfectivo = 0;
  let entradasPM = 0;
  let entradasPunto = 0;
  let totalFacturadoUSD = 0;

  listaTx.forEach(t => {
    if (t.tipo === 'venta') {
      totalFacturadoUSD += (Number(t.totalUSD) || 0);
    }
    entradasUSD += (Number(t.pagoUSD) || 0) - (Number(t.vueltoUSD) || 0);
    entradasBsEfectivo += (Number(t.pagoBsEfectivo) || 0);
    entradasPM += (Number(t.pagoPM) || 0);
    entradasPunto += (Number(t.pagoPunto) || 0);
  });

  let egresosUSD = 0;
  let egresosBsEfectivo = 0;
  let egresosPM = 0;

  listaGastos.forEach(g => {
    const m = Number(g.monto) || 0;
    if (g.metodoSalida === 'USD' || g.moneda === 'USD') {
      egresosUSD += m;
    } else if (g.metodoSalida === 'PAGO_MOVIL') {
      egresosPM += m;
    } else {
      egresosBsEfectivo += m;
    }
  });

  const totalFacturadoBS = totalFacturadoUSD * tasaNum;
  const saldoFisicoUSD = Math.max(0, entradasUSD - egresosUSD);
  const saldoFisicoBS = Math.max(0, entradasBsEfectivo - egresosBsEfectivo);
  const saldoBancoNetoBs = Math.max(0, (entradasPM + entradasPunto) - egresosPM);

  const guardarGasto = (e) => {
    e.preventDefault();
    const montoNum = Number(monto) || 0;
    if (!concepto.trim()) return alert('Introduce el concepto del gasto');
    if (montoNum <= 0) return alert('El monto debe ser mayor a 0');

    const nuevoGasto = {
      id: Date.now(),
      fecha: new Date().toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }),
      concepto: concepto.trim(),
      categoria: categoria || 'Varios',
      metodoSalida: metodoSalida || 'USD',
      moneda: metodoSalida === 'USD' ? 'USD' : 'BS',
      monto: montoNum,
      referencia: referencia ? referencia.trim() : '',
      personaRetira: personaRetira.trim() || usuarioActivo?.nombre || 'Cajero',
      registradoPor: usuarioActivo?.nombre || 'Caja'
    };

    alRegistrarGasto(nuevoGasto);

    setConcepto('');
    setMonto('');
    setReferencia('');
    setPersonaRetira('');
    setModalGastoAbierto(false);
  };

  const prepararDatosCierre = () => {
    return {
      idCierre: Math.floor(100000 + Math.random() * 900000),
      fecha: new Date().toLocaleString('es-VE'),
      responsable: usuarioActivo?.nombre || 'Caja Principal',
      tasaCambio: tasaNum,
      totalVentasUSD: totalFacturadoUSD,
      totalVentasBS: totalFacturadoBS,
      cantVentas: listaTx.length,
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
      gastosDetallados: [...listaGastos]
    };
  };

  const compartirCierreWhatsApp = () => {
    const d = prepararDatosCierre();
    let t = `🧾 *CORTE DE CAJA (CIERRE Z) #${d.idCierre}*\n`;
    t += `*${configEmpresa?.nombre || 'Mi Bodega POS'}*\n`;
    t += `Fecha: ${d.fecha}\n`;
    t += `Responsable: ${d.responsable}\n`;
    t += `Tasa BCV: Bs. ${tasaNum.toFixed(2)}/$\n`;
    t += `================================\n`;
    t += `*VENTAS TOTALES DEL TURNO:*\n`;
    t += `💵 *Total USD: $${d.totalVentasUSD.toFixed(2)}*\n`;
    t += `🇻🇪 *Total Bs: Bs. ${d.totalVentasBS.toFixed(2)}*\n`;
    t += `• Facturas emitidas: ${d.cantVentas}\n`;
    t += `--------------------------------\n`;
    t += `*EFECTIVO EN GAVETA FÍSICA:*\n`;
    t += `💵 *Dólares en Efectivo: $${d.saldoFisicoUSD.toFixed(2)}*\n`;
    t += `🇻🇪 *Bolívares en Efectivo: Bs. ${d.saldoFisicoBS.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*BANCOS Y PAGOS DIGITALES:*\n`;
    t += `• Pago Móvil Cobrado: Bs. ${d.entradasPM.toFixed(2)}\n`;
    t += `• Punto de Venta: Bs. ${d.entradasPunto.toFixed(2)}\n`;
    if (d.egresosPM > 0) t += `• Salidas por Pago Móvil: -Bs. ${d.egresosPM.toFixed(2)}\n`;
    t += `💳 *SALDO NETO EN CUENTA: Bs. ${d.saldoBancoNetoBs.toFixed(2)}*\n`;
    t += `--------------------------------\n`;
    t += `*DETALLE DE SALIDAS / GASTOS (${d.gastosDetallados.length}):*\n`;
    if (d.gastosDetallados.length === 0) {
      t += `• No hubo salidas de dinero.\n`;
    } else {
      d.gastosDetallados.forEach(g => {
        const montoStr = (g.metodoSalida === 'USD' || g.moneda === 'USD') ? `$${Number(g.monto).toFixed(2)}` : `Bs. ${Number(g.monto).toFixed(2)}`;
        t += `• ${g.concepto}: -${montoStr}\n`;
        t += `   Retiró: ${g.personaRetira || 'Caja'}${g.referencia ? ` (Ref: ${g.referencia})` : ''}\n`;
      });
      t += `Total Gastos USD: -$${d.egresosUSD.toFixed(2)}\n`;
      t += `Total Gastos Bs: -Bs. ${(d.egresosBsEfectivo + d.egresosPM).toFixed(2)}\n`;
    }
    t += `================================\n`;
    t += `¡Turno verificado y conciliado!`;

    const url = `https://wa.me/?text=${encodeURIComponent(t)}`;
    window.open(url, '_blank');
  };

  const iniciarCierreTurno = () => {
    const d = prepararDatosCierre();
    setDatosCierreParaTicket(d);
  };

  const confirmarCierreDefinitivo = () => {
    alCerrarTurno();
    setDatosCierreParaTicket(null);
    alert('¡Turno cerrado con éxito! La caja física ha sido reiniciada para el siguiente turno.');
    alVolver();
  };

  return (
    <div style={styles.contenedor} translate="no">
      {/* MODAL DE TICKET DE CIERRE Z IMPRIMIBLE */}
      {datosCierreParaTicket && (
        <TicketCierreModal
          datosCierre={datosCierreParaTicket}
          configEmpresa={configEmpresa}
          alCerrarDefinitivo={confirmarCierreDefinitivo}
          alCancelar={() => setDatosCierreParaTicket(null)}
        />
      )}

      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button type="button" onClick={alVolver} style={styles.btnBack} title="Volver al POS">
            <ArrowLeft color="#334155" size={20} />
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '800' }}>Caja y Cuadre de Turno (Z)</h2>
            <small style={{ color: '#64748b', fontSize: '0.72rem' }}>
              Responsable: <strong style={{ color: '#0052cc' }}>{usuarioActivo?.nombre || 'Principal'}</strong>
            </small>
          </div>
        </div>

        <button 
          type="button" 
          onClick={() => setModalGastoAbierto(true)} 
          style={styles.btnNuevoGasto}
        >
          <TrendingDown size={15} /> <span>Registrar Gasto</span>
        </button>
      </header>

      <div style={styles.barraTabs}>
        <button
          type="button"
          onClick={() => setTabActual('cuadre')}
          style={{
            ...styles.btnTab,
            color: tabActual === 'cuadre' ? '#0052cc' : '#64748b',
            borderBottom: tabActual === 'cuadre' ? '3px solid #0052cc' : '3px solid transparent'
          }}
        >
          <Wallet size={15} /> Arqueo de Caja (Z)
        </button>

        <button
          type="button"
          onClick={() => setTabActual('gastos')}
          style={{
            ...styles.btnTab,
            color: tabActual === 'gastos' ? '#dc2626' : '#64748b',
            borderBottom: tabActual === 'gastos' ? '3px solid #dc2626' : '3px solid transparent'
          }}
        >
          <Receipt size={15} /> Salidas y Gastos ({listaGastos.length})
        </button>
      </div>

      <div style={styles.cuerpoScroll}>
        {tabActual === 'cuadre' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* TARJETA 1: VENTAS TOTALES FACTURADAS */}
            <div style={styles.cardTotalTurno}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} color="#0052cc" />
                  <strong style={{ fontSize: '0.78rem', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Ventas Totales del Turno
                  </strong>
                </div>
                <span style={styles.pillTransacciones}>{listaTx.length} ventas</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '6px' }}>
                <div>
                  <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Total Divisa ($)</small>
                  <div style={{ fontSize: '1.45rem', fontWeight: '900', color: '#0f172a' }}>
                    ${totalFacturadoUSD.toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <small style={{ fontSize: '0.68rem', color: '#64748b' }}>Total en Bolívares</small>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#0052cc' }}>
                    Bs. {totalFacturadoBS.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* TARJETA 2: EFECTIVO FÍSICO EN GAVETA */}
            <div style={styles.cardHeroGaveta}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ fontSize: '0.78rem', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Efectivo Físico en Gaveta
                </strong>
                <span style={styles.badgeEnVivo}>Billetes Físicos</span>
              </div>

              <div style={styles.gridEfectivoHero}>
                <div style={styles.itemFisico}>
                  <span style={styles.labelFisico}>Dólares en Efectivo ($)</span>
                  <div style={styles.valorDolares}>${saldoFisicoUSD.toFixed(2)}</div>
                  <small style={{ fontSize: '0.66rem', color: '#64748b' }}>Cobrado: ${entradasUSD.toFixed(2)} · Gastos: -${egresosUSD.toFixed(2)}</small>
                </div>

                <div style={styles.itemFisico}>
                  <span style={styles.labelFisico}>Bolívares en Efectivo (Bs)</span>
                  <div style={styles.valorBolivares}>Bs. {saldoFisicoBS.toFixed(2)}</div>
                  <small style={{ fontSize: '0.66rem', color: '#64748b' }}>Cobrado: Bs. {entradasBsEfectivo.toFixed(2)} · Gastos: -Bs. {egresosBsEfectivo.toFixed(2)}</small>
                </div>
              </div>
            </div>

            {/* TARJETA 3: BANCOS Y MEDIOS DIGITALES CON NETO REAL */}
            <div style={styles.cardSeccion}>
              <div style={styles.headerCardSeccion}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Landmark size={15} color="#0052cc" />
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>Recaudo Bancario (Digital)</strong>
                </div>
                <span style={{ fontSize: '0.76rem', color: '#0052cc', fontWeight: '900' }}>
                  Saldo Neto: Bs. {saldoBancoNetoBs.toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                <div style={styles.filaDatoClean}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Smartphone size={13} color="#0284c7" /> Pago Móvil Recibido:
                  </span>
                  <strong>Bs. {entradasPM.toFixed(2)}</strong>
                </div>
                <div style={styles.filaDatoClean}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CreditCard size={13} color="#475569" /> Punto de Venta (Tarjetas):
                  </span>
                  <strong>Bs. {entradasPunto.toFixed(2)}</strong>
                </div>
                {egresosPM > 0 && (
                  <div style={{ ...styles.filaDatoClean, color: '#dc2626' }}>
                    <span>- Salidas por Pago Móvil:</span>
                    <strong>-Bs. {egresosPM.toFixed(2)}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* TARJETA 4: SALIDAS / EGRESOS */}
            <div style={styles.cardSeccion}>
              <div style={styles.headerCardSeccion}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingDown size={15} color="#dc2626" />
                  <strong style={{ fontSize: '0.82rem', color: '#0f172a' }}>Salidas / Gastos de Caja Chica</strong>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#dc2626', fontWeight: 'bold' }}>{listaGastos.length} retiros</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
                <div style={{ ...styles.filaDatoClean, color: egresosUSD > 0 ? '#dc2626' : '#64748b' }}>
                  <span>Egresos Efectivo ($):</span>
                  <strong>-${egresosUSD.toFixed(2)}</strong>
                </div>
                <div style={{ ...styles.filaDatoClean, color: (egresosBsEfectivo + egresosPM) > 0 ? '#dc2626' : '#64748b' }}>
                  <span>Egresos Bolívares (Efectivo + PM):</span>
                  <strong>-Bs. {(egresosBsEfectivo + egresosPM).toFixed(2)}</strong>
                </div>
              </div>
            </div>

            {/* BOTONERA ACCIÓN DE CIERRE */}
            <div style={styles.gridBotonesCierre}>
              <button type="button" onClick={compartirCierreWhatsApp} style={styles.btnWhatsappCierre}>
                <Share2 size={16} /> Enviar Cierre WhatsApp
              </button>
              <button type="button" onClick={iniciarCierreTurno} style={styles.btnCerrarTurnoPro}>
                <Printer size={16} /> Cerrar Turno (Ticket Z)
              </button>
            </div>

          </div>
        )}

        {tabActual === 'gastos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {listaGastos.length === 0 ? (
              <div style={styles.vacioBox}>
                <Receipt size={40} color="#cbd5e1" />
                <p style={{ margin: '8px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>No hay gastos registrados en este turno.</p>
                <button type="button" onClick={() => setModalGastoAbierto(true)} style={styles.btnGastoVacio}>
                  <Plus size={14} /> Registrar Primer Gasto
                </button>
              </div>
            ) : (
              listaGastos.map(g => (
                <div key={g.id} style={styles.cardItemGasto}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '0.88rem', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.concepto}
                      </strong>
                      <span style={styles.pillCategoria}>{g.categoria}</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '3px' }}>
                      <span>Hora: {g.fecha}</span>
                      {g.personaRetira && <span> · Retiró: <strong>{g.personaRetira}</strong></span>}
                      {g.metodoSalida === 'PAGO_MOVIL' && (
                        <span style={{ color: '#0284c7', fontWeight: 'bold' }}> · Pago Móvil {g.referencia ? `(Ref: ${g.referencia})` : ''}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <strong style={{ fontSize: '0.98rem', color: '#dc2626' }}>
                      {g.metodoSalida === 'USD' || g.moneda === 'USD' 
                        ? `-$${Number(g.monto).toFixed(2)}` 
                        : `-Bs. ${Number(g.monto).toFixed(2)}`}
                    </strong>
                    <button 
                      type="button" 
                      onClick={() => alEliminarGasto(g.id)} 
                      style={styles.btnDeleteGasto}
                      title="Eliminar gasto"
                    >
                      <Trash2 size={13} color="#dc2626" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {modalGastoAbierto && (
        <div style={styles.overlay} translate="no">
          <div style={styles.modalBoxCard}>
            <div style={styles.headerModalGasto}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '800' }}>Registrar Gasto de Caja</h3>
                <small style={{ color: '#64748b', fontSize: '0.7rem' }}>Salida de dinero de la gaveta o cuenta bancaria</small>
              </div>
              <button type="button" onClick={() => setModalGastoAbierto(false)} style={styles.btnCerrarX}><X size={18} /></button>
            </div>

            <form onSubmit={guardarGasto} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '14px' }}>
              <div style={styles.campo}>
                <label style={styles.lbl}>Concepto / Descripción del Gasto *</label>
                <input 
                  type="text" 
                  placeholder="Ej: Pago de hielo, bolsas, almuerzo, delivery..." 
                  value={concepto} 
                  onChange={(e) => setConcepto(e.target.value)} 
                  style={styles.inputGrande} 
                  required 
                  autoFocus 
                />
              </div>

              <div style={styles.campo}>
                <label style={styles.lbl}>Medio de Retiro *</label>
                <div style={styles.gridOpcionesSalida}>
                  <button
                    type="button"
                    onClick={() => setMetodoSalida('USD')}
                    style={{
                      ...styles.btnOpcionSalida,
                      backgroundColor: metodoSalida === 'USD' ? '#ecfdf5' : '#f8fafc',
                      borderColor: metodoSalida === 'USD' ? '#059669' : '#cbd5e1',
                      color: metodoSalida === 'USD' ? '#065f46' : '#475569'
                    }}
                  >
                    <DollarSign size={14} />
                    <span>Efectivo ($)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoSalida('BS_EFECTIVO')}
                    style={{
                      ...styles.btnOpcionSalida,
                      backgroundColor: metodoSalida === 'BS_EFECTIVO' ? '#eff6ff' : '#f8fafc',
                      borderColor: metodoSalida === 'BS_EFECTIVO' ? '#2563eb' : '#cbd5e1',
                      color: metodoSalida === 'BS_EFECTIVO' ? '#1e40af' : '#475569'
                    }}
                  >
                    <span>🇻🇪 Efectivo (Bs)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetodoSalida('PAGO_MOVIL')}
                    style={{
                      ...styles.btnOpcionSalida,
                      backgroundColor: metodoSalida === 'PAGO_MOVIL' ? '#f0fdf4' : '#f8fafc',
                      borderColor: metodoSalida === 'PAGO_MOVIL' ? '#0284c7' : '#cbd5e1',
                      color: metodoSalida === 'PAGO_MOVIL' ? '#0369a1' : '#475569'
                    }}
                  >
                    <Smartphone size={14} />
                    <span>Pago Móvil</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                <div style={styles.campo}>
                  <label style={styles.lbl}>Monto a Retirar *</label>
                  <input 
                    type="number" 
                    step="any" 
                    placeholder={metodoSalida === 'USD' ? '$ 0.00' : 'Bs. 0.00'} 
                    value={monto} 
                    onChange={(e) => setMonto(e.target.value)} 
                    style={styles.inputMontoDestacado} 
                    required 
                  />
                </div>

                <div style={styles.campo}>
                  <label style={styles.lbl}>Categoría</label>
                  <select 
                    value={categoria} 
                    onChange={(e) => setCategoria(e.target.value)} 
                    style={styles.select}
                  >
                    <option value="Proveedores">Proveedores</option>
                    <option value="Operativo">Operativo</option>
                    <option value="Personal">Personal</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Varios">Varios</option>
                  </select>
                </div>
              </div>

              {metodoSalida === 'PAGO_MOVIL' && (
                <div style={styles.campo}>
                  <label style={styles.lbl}>Referencia Bancaria (Opcional)</label>
                  <input 
                    type="text" 
                    placeholder="Ej: 8492" 
                    value={referencia} 
                    onChange={(e) => setReferencia(e.target.value)} 
                    style={styles.input} 
                  />
                </div>
              )}

              <div style={styles.campo}>
                <label style={styles.lbl}>Persona que Autoriza / Retira</label>
                <input 
                  type="text" 
                  placeholder={usuarioActivo?.nombre || 'Nombre de quien recibe'} 
                  value={personaRetira} 
                  onChange={(e) => setPersonaRetira(e.target.value)} 
                  style={styles.input} 
                />
              </div>

              <button type="submit" style={styles.btnConfirmarGasto}>
                Confirmar Salida de Dinero
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  contenedor: { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' },
  header: { padding: '10px 14px', backgroundColor: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', flexShrink: 0 },
  btnBack: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnNuevoGasto: { backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', padding: '6px 12px', fontSize: '0.76rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' },
  
  barraTabs: { display: 'flex', backgroundColor: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 14px', flexShrink: 0 },
  btnTab: { background: 'none', border: 'none', padding: '10px 14px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'bold' },
  
  cuerpoScroll: { flex: 1, overflowY: 'auto', padding: '14px' },

  cardTotalTurno: { backgroundColor: '#eff6ff', border: '1.5px solid #bfdbfe', borderRadius: '16px', padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' },
  pillTransacciones: { backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.66rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px' },

  cardHeroGaveta: { backgroundColor: '#f0fdf4', border: '1.5px solid #a7f3d0', borderRadius: '16px', padding: '14px' },
  badgeEnVivo: { backgroundColor: '#dcfce7', color: '#15803d', fontSize: '0.62rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px' },
  gridEfectivoHero: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' },
  itemFisico: { backgroundColor: '#fff', padding: '10px 12px', borderRadius: '12px', border: '1px solid #86efac' },
  labelFisico: { fontSize: '0.68rem', color: '#475569', fontWeight: 'bold', display: 'block' },
  valorDolares: { fontSize: '1.45rem', fontWeight: '900', color: '#047857', marginTop: '2px' },
  valorBolivares: { fontSize: '1.25rem', fontWeight: '900', color: '#1d4ed8', marginTop: '2px' },

  cardSeccion: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '12px 14px' },
  headerCardSeccion: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' },
  filaDatoClean: { display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155' },

  gridBotonesCierre: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' },
  btnWhatsappCierre: { padding: '12px 6px', backgroundColor: '#22c55e', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },
  btnCerrarTurnoPro: { padding: '12px 6px', backgroundColor: '#0052cc', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' },

  vacioBox: { textAlign: 'center', padding: '40px 14px', backgroundColor: '#fff', borderRadius: '14px', border: '1px solid #e2e8f0' },
  btnGastoVacio: { marginTop: '12px', padding: '8px 14px', backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '0.76rem', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' },
  cardItemGasto: { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pillCategoria: { backgroundColor: '#f1f5f9', color: '#475569', fontSize: '0.62rem', fontWeight: 'bold', padding: '1px 5px', borderRadius: '4px' },
  btnDeleteGasto: { background: '#fee2e2', border: 'none', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },

  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10000, padding: '14px' },
  modalBoxCard: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '380px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' },
  headerModalGasto: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrarX: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },

  campo: { display: 'flex', flexDirection: 'column', gap: '3px' },
  lbl: { fontSize: '0.7rem', fontWeight: 'bold', color: '#475569' },
  input: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none' },
  inputGrande: { width: '100%', boxSizing: 'border-box', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.88rem', fontWeight: '600', outline: 'none' },
  inputMontoDestacado: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1.5px solid #dc2626', fontSize: '1.1rem', fontWeight: 'bold', color: '#dc2626', outline: 'none' },
  select: { width: '100%', boxSizing: 'border-box', padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.84rem', outline: 'none', background: '#fff' },

  gridOpcionesSalida: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' },
  btnOpcionSalida: { border: '1.5px solid', borderRadius: '8px', padding: '7px 2px', fontSize: '0.68rem', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', cursor: 'pointer' },
  btnConfirmarGasto: { width: '100%', padding: '12px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }
};
