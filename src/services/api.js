const API_URL = 'http://localhost:4000/api';

export const apiService = {
  async registrarDueno(datos) {
    try {
      const res = await fetch(`${API_URL}/auth/registro-negocio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar');
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async loginDueno(correo, password) {
    try {
      const res = await fetch(`${API_URL}/auth/login-dueno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Credenciales inválidas');
      }
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async solicitarRecuperacion(correo) {
    try {
      const res = await fetch(`${API_URL}/auth/solicitar-recuperacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async restablecerPassword(correo, codigo, nuevoPassword) {
    try {
      const res = await fetch(`${API_URL}/auth/restablecer-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, codigo, nuevoPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'No se pudo restablecer');
      }
      return await res.json();
    } catch (e) {
      throw new Error(e.message);
    }
  },

  async crearCajero(negocioId, nombre, pin) {
    try {
      const res = await fetch(`${API_URL}/cajeros`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, nombre, pin })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async sincronizarVentas(negocioId, ventas) {
    try {
      const res = await fetch(`${API_URL}/sync/ventas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, ventas })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  },

  async consultarLicencia(negocioId) {
    try {
      const res = await fetch(`${API_URL}/licencia/estado/${negocioId}`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return null;
  },

  // MÉTODOS SUPERADMIN
  async adminObtenerNegocios() {
    try {
      const res = await fetch(`${API_URL}/admin/negocios`);
      if (res.ok) return await res.json();
    } catch (e) {}
    return [];
  },

  async adminExtenderLicencia(negocioId, dias) {
    try {
      const res = await fetch(`${API_URL}/admin/extender-licencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, dias })
      });
      return await res.json();
    } catch (e) { return null; }
  },

  async adminCambiarEstado(negocioId, estado) {
    try {
      const res = await fetch(`${API_URL}/admin/cambiar-estado`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ negocioId, estado })
      });
      return await res.json();
    } catch (e) { return null; }
  }
};
