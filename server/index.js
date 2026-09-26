const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_pos_venezuela_2026';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function calcularVencimientoDias(dias = 30) {
  const f = new Date();
  f.setDate(f.getDate() + dias);
  return f.toISOString();
}

app.post('/api/auth/registro-negocio', async (req, res) => {
  try {
    const { nombreNegocio, nombreDueno, correo, password } = req.body;
    if (!nombreNegocio || !nombreDueno || !correo || !password) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    const negocioId = 'neg_' + Date.now().toString(36);
    const usuarioId = 'usr_' + Date.now().toString(36);
    const fechaCreacion = new Date().toISOString();
    const licenciaHasta = calcularVencimientoDias(30);
    const passwordHash = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO negocios (id, nombre, licencia_valida_hasta, estado, fecha_creacion) VALUES (?, ?, ?, 'activo', ?)`,
      [negocioId, nombreNegocio.trim(), licenciaHasta, fechaCreacion],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al crear negocio: ' + err.message });

        db.run(
          `INSERT INTO usuarios (id, negocio_id, nombre, correo, password_hash, rol, fecha_creacion) VALUES (?, ?, ?, ?, ?, 'dueno', ?)`,
          [usuarioId, negocioId, nombreDueno.trim(), correo.trim().toLowerCase(), passwordHash, fechaCreacion],
          function (errUsr) {
            if (errUsr) return res.status(500).json({ error: 'Error al crear usuario dueño: ' + errUsr.message });

            const token = jwt.sign({ usuarioId, negocioId, rol: 'dueno' }, JWT_SECRET, { expiresIn: '60d' });

            return res.json({
              mensaje: 'Negocio y cuenta de dueño creados exitosamente.',
              token,
              negocio: { id: negocioId, nombre: nombreNegocio, licenciaHasta },
              usuario: { id: usuarioId, nombre: nombreDueno, rol: 'dueno', correo }
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error interno en servidor: ' + error.message });
  }
});

app.post('/api/auth/login-dueno', (req, res) => {
  const { correo, password } = req.body;
  if (!correo || !password) return res.status(400).json({ error: 'Correo y clave requeridos.' });

  const query = `
    SELECT u.*, n.nombre as nombre_negocio, n.licencia_valida_hasta, n.estado as estado_negocio
    FROM usuarios u
    JOIN negocios n ON u.negocio_id = n.id
    WHERE u.correo = ? AND u.rol = 'dueno'
  `;

  db.get(query, [correo.trim().toLowerCase()], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Correo no registrado o no autorizado.' });

    const passwordValido = await bcrypt.compare(password, user.password_hash);
    if (!passwordValido) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    const fechaVence = new Date(user.licencia_valida_hasta);
    const hoy = new Date();
    const suscripcionVencida = hoy > fechaVence || user.estado_negocio !== 'activo';

    const token = jwt.sign(
      { usuarioId: user.id, negocioId: user.negocio_id, rol: 'dueno' }, 
      JWT_SECRET, 
      { expiresIn: '30d' }
    );

    return res.json({
      token,
      usuario: { id: user.id, nombre: user.nombre, correo: user.correo, rol: 'dueno' },
      negocio: { 
        id: user.negocio_id, 
        nombre: user.nombre_negocio, 
        licenciaHasta: user.licencia_valida_hasta,
        suscripcionVencida 
      }
    });
  });
});

app.post('/api/cajeros', async (req, res) => {
  try {
    const { negocioId, nombre, pin } = req.body;
    if (!negocioId || !nombre || !pin || pin.length !== 6) {
      return res.status(400).json({ error: 'Se requiere nombre y un PIN de exactamente 6 dígitos.' });
    }

    const pinHash = await bcrypt.hash(pin, 10);
    const cajeroId = 'caj_' + Date.now().toString(36);
    const fecha = new Date().toISOString();

    db.run(
      `INSERT INTO usuarios (id, negocio_id, nombre, pin_hash, rol, fecha_creacion) VALUES (?, ?, ?, ?, 'cajero', ?)`,
      [cajeroId, negocioId, nombre.trim(), pinHash, fecha],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ mensaje: 'Cajero registrado con éxito.', cajero: { id: cajeroId, nombre, rol: 'cajero', fecha } });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/cajeros/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  db.all(
    `SELECT id, nombre, rol, fecha_creacion FROM usuarios WHERE negocio_id = ? AND rol = 'cajero'`,
    [negocioId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

app.post('/api/auth/login-cajero', (req, res) => {
  const { cajeroId, pin } = req.body;
  if (!cajeroId || !pin) return res.status(400).json({ error: 'Cajero y PIN requeridos.' });

  db.get(`SELECT * FROM usuarios WHERE id = ? AND rol = 'cajero'`, [cajeroId], async (err, cajero) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cajero) return res.status(404).json({ error: 'Cajero no encontrado.' });

    const pinValido = await bcrypt.compare(pin, cajero.pin_hash);
    if (!pinValido) return res.status(401).json({ error: 'PIN de 6 dígitos incorrecto.' });

    const token = jwt.sign(
      { usuarioId: cajero.id, negocioId: cajero.negocio_id, rol: 'cajero' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      usuario: { id: cajero.id, nombre: cajero.nombre, rol: 'cajero', negocioId: cajero.negocio_id }
    });
  });
});

app.post('/api/sync/ventas', (req, res) => {
  const { negocioId, ventas = [] } = req.body;
  if (!negocioId || !Array.isArray(ventas)) {
    return res.status(400).json({ error: 'Datos de sincronización inválidos.' });
  }

  if (ventas.length === 0) return res.json({ sincronizadas: 0 });

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO ventas (
      id, negocio_id, ticket_id, cajero_nombre, total_usd, total_bs,
      tasa_cambio, items_json, es_credito, cliente_doc, cliente_nombre,
      descuento_usd, fecha, anulada
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.serialize(() => {
    ventas.forEach(v => {
      stmt.run(
        v.id.toString(),
        negocioId,
        v.ticket_id || v.id.toString(),
        v.cajeroCobrador || 'Caja',
        parseFloat(v.totalUSD) || 0,
        parseFloat(v.totalBS) || 0,
        parseFloat(v.tasa) || 1,
        JSON.stringify(v.items || []),
        v.esCredito ? 1 : 0,
        v.cliente?.doc || '',
        v.cliente?.nombre || '',
        parseFloat(v.descuentoUSD) || 0,
        v.fecha || new Date().toISOString(),
        v.anulada ? 1 : 0
      );
    });
    stmt.finalize();
    res.json({ mensaje: 'Lote sincronizado con éxito.', sincronizadas: ventas.length });
  });
});

app.get('/api/licencia/estado/:negocioId', (req, res) => {
  const { negocioId } = req.params;
  db.get(`SELECT id, nombre, licencia_valida_hasta, estado FROM negocios WHERE id = ?`, [negocioId], (err, row) => {
    if (err || !row) return res.status(404).json({ error: 'Negocio no encontrado.' });

    const hoy = new Date();
    const vence = new Date(row.licencia_valida_hasta);
    const diasRestantes = Math.ceil((vence - hoy) / (1000 * 60 * 60 * 24));
    const activa = diasRestantes >= 0 && row.estado === 'activo';

    res.json({
      negocio: row.nombre,
      activa,
      diasRestantes,
      licenciaHasta: row.licencia_valida_hasta,
      requiereRenovacion: diasRestantes <= 3
    });
  });
});

const codigosRescateMemoria = {};

app.post('/api/auth/solicitar-recuperacion', (req, res) => {
  const { correo } = req.body;
  if (!correo) return res.status(400).json({ error: 'El correo es requerido.' });

  db.get(`SELECT * FROM usuarios WHERE correo = ? AND rol = 'dueno'`, [correo.trim().toLowerCase()], (err, user) => {
    if (err || !user) {
      return res.json({ mensaje: 'Si el correo está registrado, se ha generado un código de recuperación.' });
    }

    const codigoOTP = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 10 * 60 * 1000;

    codigosRescateMemoria[user.correo] = { codigo: codigoOTP, expira };
    console.log(`🔑 [CÓDIGO DE RESCATE para ${user.correo}]: ${codigoOTP}`);

    res.json({ mensaje: 'Código de recuperación generado.', debugCodigoLocal: codigoOTP });
  });
});

app.post('/api/auth/restablecer-password', async (req, res) => {
  try {
    const { correo, codigo, nuevoPassword } = req.body;
    if (!correo || !codigo || !nuevoPassword || nuevoPassword.length < 6) {
      return res.status(400).json({ error: 'Datos incompletos o contraseña muy corta.' });
    }

    const registro = codigosRescateMemoria[correo.trim().toLowerCase()];
    if (!registro || registro.codigo !== codigo.trim() || Date.now() > registro.expira) {
      return res.status(400).json({ error: 'El código es inválido o ha expirado.' });
    }

    const nuevoHash = await bcrypt.hash(nuevoPassword.trim(), 10);

    db.run(
      `UPDATE usuarios SET password_hash = ? WHERE correo = ? AND rol = 'dueno'`,
      [nuevoHash, correo.trim().toLowerCase()],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
        delete codigosRescateMemoria[correo.trim().toLowerCase()];
        res.json({ mensaje: 'Contraseña actualizada exitosamente con seguridad.' });
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor POS Backend corriendo en http://0.0.0.0:${PORT}`);
});
