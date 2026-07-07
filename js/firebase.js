import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, get, update, remove, child } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

const firebaseConfig = {
  databaseURL: "https://acme-8041f-default-rtdb.firebaseio.com/",
  projectId: "acme-8041f"
};

let app;
let db;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
} catch (error) {
    console.error(error);
}

export { app, db, ref, set, get, update, remove, child };
