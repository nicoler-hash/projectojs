export const AppEvents = {
  toast: 'acme:toast',
  authChanged: 'acme:auth-changed',
};

export function dispatch(name, detail = {}) {
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

