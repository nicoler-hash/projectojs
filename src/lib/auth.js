import { dispatch, AppEvents } from './events.js';
import { safeTrim } from './format.js';
import { database, ref, get, set } from './rtdb.js';

const SESSION_KEY = 'acme_session';

function normalizeIdent(ident) {
  return safeTrim(ident);
}

function userPath(identificacion) {
  return `users/${identificacion}`;
}

export function onAuth(consumer) {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    consumer(session);
  } catch {
    consumer(null);
  }

  const handler = () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      const session = raw ? JSON.parse(raw) : null;
      consumer(session);
      dispatch(AppEvents.authChanged, { user: session });
    } catch {
      consumer(null);
      dispatch(AppEvents.authChanged, { user: null });
    }
  };

  window.addEventListener('storage', handler);

  return () => window.removeEventListener('storage', handler);
}

export async function registerUser({ identificacion, nombre, cargo, password, password2 }) {
  identificacion = normalizeIdent(identificacion);
  nombre = safeTrim(nombre);
  cargo = safeTrim(cargo);

  if (!identificacion) throw new Error('La identificación es obligatoria');
  if (!nombre) throw new Error('El nombre completo es obligatorio');
  if (!cargo) throw new Error('El cargo es obligatorio');
  if (!password) throw new Error('La contraseña es obligatoria');
  if (password !== password2) throw new Error('Las contraseñas no coinciden');
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

  const uref = ref(database, userPath(identificacion));
  const snap = await get(uref);
  if (snap.exists()) throw new Error('El usuario ya existe');

  const record = {
    identificacion,
    nombre,
    cargo,
    password,
    createdAt: Date.now(),
  };

  await set(uref, record);
  return { identificacion };
}

export async function loginUser({ identificacion, password }) {
  identificacion = normalizeIdent(identificacion);
  password = safeTrim(password);

  if (!identificacion) throw new Error('La identificación es obligatoria');
  if (!password) throw new Error('La contraseña es obligatoria');

  const uref = ref(database, userPath(identificacion));
  const snap = await get(uref);

  if (!snap.exists()) throw new Error('Usuario no registrado');

  const user = snap.val();
  if (user?.password !== password) throw new Error('Contraseña incorrecta');

  const session = {
    identificacion: user.identificacion,
    nombreCompleto: user.nombre,
    cargo: user.cargo,
  };

  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  dispatch(AppEvents.authChanged, { user: session });
  return { identificacion: session.identificacion };
}

export async function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  dispatch(AppEvents.authChanged, { user: null });
}


