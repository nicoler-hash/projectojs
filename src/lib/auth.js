import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import { auth } from './firebase.js';
import { db } from './firebase.js';
import { doc, setDoc, getDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js';
import { safeTrim } from './format.js';
import { dispatch, AppEvents } from './events.js';

// We use Firebase Auth for sessions, but user data is stored in Firestore.
// Login is requested by: identificacion + password.
// Since Firebase Auth requires email/password, we map identificacion -> email.
// email format: ident+'@acme.local'
function emailFromId(ident) {
  return `${ident}@acme.local`;
}

export function onAuth(consumer) {
  return onAuthStateChanged(auth, (user) => {
    consumer(user);
    dispatch(AppEvents.authChanged, { user });
  });
}

export async function registerUser({ identificacion, nombre, cargo, password, password2 }) {
  identificacion = safeTrim(identificacion);
  nombre = safeTrim(nombre);
  cargo = safeTrim(cargo);

  if (!identificacion) throw new Error('La identificación es obligatoria');
  if (!nombre) throw new Error('El nombre completo es obligatorio');
  if (!cargo) throw new Error('El cargo es obligatorio');
  if (!password) throw new Error('La contraseña es obligatoria');
  if (password !== password2) throw new Error('Las contraseñas no coinciden');
  if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres');

  const email = emailFromId(identificacion);

  // Store in Firestore first (to be able to render later), then create auth user.
  const ref = doc(db, 'users', identificacion);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error('El usuario ya existe');

  const cred = await createUserWithEmailAndPassword(auth, email, password);

  await setDoc(ref, {
    identificacion,
    nombre,
    cargo,
    uid: cred.user.uid,
    createdAt: serverTimestamp(),
  });

  return { identificacion };
}

export async function loginUser({ identificacion, password }) {
  identificacion = safeTrim(identificacion);
  if (!identificacion) throw new Error('La identificación es obligatoria');
  if (!password) throw new Error('La contraseña es obligatoria');

  const email = emailFromId(identificacion);
  await signInWithEmailAndPassword(auth, email, password);
  return { identificacion };
}

export async function logoutUser() {
  const { signOut } = await import('https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js');
  await signOut(auth);
}

