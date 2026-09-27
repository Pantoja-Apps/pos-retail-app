const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;
const DB_PATH = path.join(__dirname, 'pos_database.json');

app.use(cors());
app.use(express.json({ limit: '15mb' }));

const DB_INICIAL = {
  negocios: [],
  usuarios: [],
  cajeros: [],
  configuracion: {},
  productos: [],
  clientes: [],
  ventas: []
};

function leerDB() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify(DB_INICIAL, null, 2));
      return DB_INICIAL;
    }
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return DB_INICIAL;
  }
}

function guardarDB(db) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('[SERVER] Error guardando base de datos:', e);
  }
}

// 1. Registro de Dueño
app.post('/api/auth/registro-dueno', (req, res) => {
  try {
    const { nombreNegocio, nombreDueno, correo, password } = req.body;
    const db = leerDB();
    const negocioId = 'neg_' + Date.now().toString(36);
    const ahora = new Date();
    const licenciaHasta = new Date(ahora.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString();

    const nuevoNegocio = { id: negocioId, nombre: nombreNegocio, licenciaHasta, activa: true };
    const nuevoUsuario = { id: Date.now(), negocioId, nombre: nombreDueno, correo: correo.toLowerCase().trim(), password, rol: 'dueno' };

    db.negocios.push(nuevoNegocio);
    db.usuarios.push(nuevoUsuario);
    db.configuracion = { nombre: nombreNegocio, rif: 'J-50000000-0', direccion: 'Caracas, Venezuela', telefono: '' };
    guardarDB(db);

    res.json({ token: 'tok_' + Date.now(), negocio: nuevoNegocio, usuario: { nombre: nombreDueno, correo } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Login Dueño
app.post('/api/auth/login-dueno', (req, res) => {
  try {
    const { correo, password } = req.body;
    const db = leerDB();
    const user = db.usuarios.find(u => u.correo === correo.toLowerCase().trim() && u.password === password);
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    let negocio = db.negocios.find(n => n.id === user.negocioId) || { id: user.negocioId, nombre: 'Mi Bodega POS', licenciaHasta: new Date(Date.now() + 15*86400000).toISOString(), activa: true };

    res.json({ token: 'tok_' + Date.now(), usuario: { nombre: user.nombre, correo: user.correo }, negocio });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Crear / Actualizar Cajero
app.post('/api/cajeros', (req, res) => {
  try {
    const { negocioId, nombre, pin } = req.body;
    const db = leerDB();
    const idx = db.cajeros.findIndex(c => c.nombre.toLowerCase().trim() === nombre.toLowerCase().trim());
    if (idx >= 0) {
      db.cajeros[idx].pin = pin;
    } else {
      db.cajeros.push({ id: Date.now(), negocioId: negocioId || 'neg_local', nombre: nombre.trim(), pin: pin.trim(), creadoEn: new Date().toLocaleDateString('es-VE') });
    }
    guardarDB(db);
    res.json({ ok: true, cajeros: db.cajeros });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 4. Obtener Cajeros
app.get('/api/cajeros/:negocioId', (req, res) => {
  try {
    const db = leerDB();
    res.json(db.cajeros || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Consulta de Licencia
app.get('/api/licencia/:negocioId', (req, res) => {
  try {
    const db = leerDB();
    const negocio = db.negocios[0] || { id: 'neg_local', nombre: 'Mi Bodega POS', licenciaHasta: new Date(Date.now() + 15*86400000).toISOString(), activa: true };
    const diff = Math.ceil((new Date(negocio.licenciaHasta) - new Date()) / (1000 * 60 * 60 * 24));
    res.json({ activa: negocio.activa !== false && diff > 0, diasRestantes: Math.max(0, diff), licenciaHasta: negocio.licenciaHasta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Sincronizar Ventas (Guardar ventas nuevas)
app.post('/api/ventas/sync', (req, res) => {
  try {
    const { negocioId, ventas } = req.body;
    const db = leerDB();
    for (const v of (ventas || [])) {
      const idx = db.ventas.findIndex(item => String(item.id) === String(v.id));
      if (idx >= 0) {
        db.ventas[idx] = { ...v, negocioId };
      } else {
        db.ventas.unshift({ ...v, negocioId });
      }
    }
    guardarDB(db);
    res.json({ ok: true, totalVentas: db.ventas.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Descargar todas las ventas (Para que el Dueño vea las de la Caja 02)
app.get('/api/ventas/:negocioId', (req, res) => {
  try {
    const db = leerDB();
    res.json(db.ventas || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Sincronizar Configuración del Negocio (MiniMarket JJJP, Logo, etc.)
app.post('/api/configuracion', (req, res) => {
  try {
    const db = leerDB();
    db.configuracion = { ...db.configuracion, ...req.body };
    guardarDB(db);
    res.json({ ok: true, configuracion: db.configuracion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/configuracion', (req, res) => {
  try {
    const db = leerDB();
    res.json(db.configuracion || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] 🚀 Servidor POS Backend corriendo en http://0.0.0.0:${PORT}`);
});
