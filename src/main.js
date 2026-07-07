import './style-shims.js';
import './webcomponents/acme-app.js';
import './webcomponents/ui/acme-toast.js';
import './webcomponents/ui/acme-modal.js';
import './webcomponents/ui/acme-input.js';
import './webcomponents/ui/acme-button.js';
import './webcomponents/features/login-view.js';
import './webcomponents/features/users-view.js';
import './webcomponents/features/inventory-view.js';
import './webcomponents/features/production-view.js';

// Boot
const app = document.querySelector('acme-app');
if (!app) {
  const el = document.createElement('acme-app');
  document.body.appendChild(el);
}

