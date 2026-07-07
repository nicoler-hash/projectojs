import { db, ref, set, get, update, remove, child } from '../firebase.js';

const withRetry = async (operation, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    let delay = initialDelay;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            console.warn(`Intento ${attempt} de operación DB fallido: ${error.message}. Reintentando en ${delay}ms...`);
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Backoff exponencial
            }
        }
    }
    
    throw new Error(`La operación falló definitivamente tras ${maxRetries} intentos. Error: ${lastError.message}`);
};

export const api = {
    async create(path, id, data) {
        if (!db) throw new Error("Firebase no está configurado");
        const dbRef = ref(db, `${path}/${id}`);
        await withRetry(() => set(dbRef, data));
        return data;
    },

    async read(path) {
        if (!db) throw new Error("Firebase no está configurado");
        const dbRef = ref(db);
        const snapshot = await withRetry(() => get(child(dbRef, path)));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    },

    async readOne(path, id) {
        if (!db) throw new Error("Firebase no está configurado");
        const dbRef = ref(db);
        const snapshot = await withRetry(() => get(child(dbRef, `${path}/${id}`)));
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            return null;
        }
    },

    async update(path, id, data) {
        if (!db) throw new Error("Firebase no está configurado");
        const dbRef = ref(db, `${path}/${id}`);
        await withRetry(() => update(dbRef, data));
        return data;
    },

    async remove(path, id) {
        if (!db) throw new Error("Firebase no está configurado");
        const dbRef = ref(db, `${path}/${id}`);
        await withRetry(() => remove(dbRef));
        return true;
    }
};

export const database = api;
