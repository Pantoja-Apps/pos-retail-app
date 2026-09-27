import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

export default function ScannerModal({ abierto, alDetectar, alCerrar }) {
  const scannerRef = useRef(null);
  const containerId = 'lector-camara-pos';

  useEffect(() => {
    let html5QrCode = null;

    if (abierto) {
      setTimeout(() => {
        try {
          html5QrCode = new Html5Qrcode(containerId);
          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          };

          html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (textoDetectado) => {
              if (scannerRef.current) {
                scannerRef.current.stop().then(() => {
                  alDetectar(textoDetectado);
                }).catch(() => {
                  alDetectar(textoDetectado);
                });
              } else {
                alDetectar(textoDetectado);
              }
            },
            (errorMessage) => {
              // lectura en progreso
            }
          ).catch((err) => {
            console.error('Error al iniciar cámara:', err);
          });
        } catch (e) {
          console.error('Excepción cámara:', e);
        }
      }, 300);
    }

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop().then(() => {
            scannerRef.current.clear();
          }).catch(() => {});
        } catch (e) {}
      }
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div style={styles.overlay} translate="no">
      <div style={styles.modalBox}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Camera size={18} color="#0052cc" />
            <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Escanear QR / Código</strong>
          </div>
          <button type="button" onClick={alCerrar} style={styles.btnCerrar} title="Cerrar"><X size={18} /></button>
        </div>

        <div style={styles.cuerpoCamara}>
          <div id={containerId} style={styles.visorHtml5}></div>
        </div>

        <div style={styles.pieAviso}>
          Apunta al código QR o de barras para detección automática
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, padding: '14px' },
  modalBox: { background: '#fff', borderRadius: '18px', width: '100%', maxWidth: '360px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' },
  header: { padding: '12px 14px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnCerrar: { background: '#f1f5f9', border: 'none', borderRadius: '50%', cursor: 'pointer', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  cuerpoCamara: { position: 'relative', width: '100%', minHeight: '300px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  visorHtml5: { width: '100%', height: '100%' },
  pieAviso: { padding: '10px 14px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0' }
};
