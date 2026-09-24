import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X } from 'lucide-react';

export default function ScannerModal({ abierto, alDetectar, alCerrar }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;

    const html5QrCode = new Html5Qrcode("lector-camara-nativo");
    scannerRef.current = html5QrCode;

    // Forzar cámara trasera principal directamente
    html5QrCode.start(
      { facingMode: "environment" },
      {
        fps: 10,
        qrbox: { width: 260, height: 160 },
        aspectRatio: 1.0,
      },
      (decodedText) => {
        // Al detectar código, apagar cámara y enviar dato
        html5QrCode.stop().then(() => {
          alDetectar(decodedText);
          alCerrar();
        }).catch(() => {
          alDetectar(decodedText);
          alCerrar();
        });
      },
      (error) => {
        // Ignorar frames sin código
      }
    ).catch((err) => {
      console.error("Error al iniciar cámara trasera:", err);
    });

    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [abierto]);

  if (!abierto) return null;

  return (
    <div style={estilos.overlay}>
      <div style={estilos.modal}>
        <div style={estilos.header}>
          <h3 style={{ margin: 0, fontSize: '1rem', color: '#111' }}>Escanear Producto</h3>
          <button 
            onClick={() => {
              if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(alCerrar).catch(alCerrar);
              } else {
                alCerrar();
              }
            }} 
            style={estilos.btnCerrar}
          >
            <X size={22} color="#333" />
          </button>
        </div>
        
        {/* Visor de la cámara */}
        <div id="lector-camara-nativo" style={estilos.visorCamara}></div>
        
        <p style={estilos.textoAyuda}>
          Apunta con la cámara trasera al código de barras
        </p>
      </div>
    </div>
  );
}

const estilos = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    background: '#fff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '360px',
    padding: '16px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  btnCerrar: {
    background: '#f1f3f5',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  visorCamara: {
    width: '100%',
    minHeight: '260px',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  textoAyuda: {
    fontSize: '0.85rem',
    color: '#666',
    textAlign: 'center',
    margin: '12px 0 0 0',
    fontWeight: '500',
  },
};
