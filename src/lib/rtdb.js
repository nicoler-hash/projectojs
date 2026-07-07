import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getDatabase, ref, get, set } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';

import { firebaseConfig } from './firebase.config.js';

export const RTDB_URL = 'https://acme-8041f-default-rtdb.firebaseio.com/';

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app, RTDB_URL);

export { ref, get, set };


