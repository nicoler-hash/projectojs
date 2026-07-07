import { AppEvents } from '../../lib/events.js';
import { commonUiCss } from '../../lib/common-ui-css.js';

class AcmeToastWrap extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.toasts = [];
  }

  connectedCallback() {
    this.render();

    window.addEventListener(AppEvents.toast, (e) => {
      const { type = 'success', title = 'Info', message = '' } = e.detail || {};
      const id = crypto.randomUUID();
      this.toasts.unshift({ id, type, title, message });
      this.renderToasts();
      setTimeout(() => this.dismiss(id), 4500);
    });
  }

  dismiss(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.renderToasts();
  }

  static get styleText() {
    return `
      ${commonUiCss()}
      .toast-wrap{
        position:fixed;
        right:14px;
        bottom:14px;
        z-index:9999;
        display:flex;
        flex-direction:column;
        gap:10px;
      }
      .toast{
        width:min(360px, calc(100vw - 28px));
        border-radius:14px;
        border:1px solid var(--border);
        background: rgba(18,26,45,.92);
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow);
        padding:12px 12px;
        display:flex;
        gap:10px;
        align-items:flex-start;
      }
      .toast .dot{width:10px; height:10px; border-radius:50%; margin-top:4px}
      .toast .content{flex:1}
      .toast .title{font-weight:900; font-size:14px; margin-bottom:2px}
      .toast .msg{color: var(--muted); font-size:13px; line-height:1.25}
      .toast button{
        border:none; background:transparent; color:var(--muted);
        cursor:pointer; font-size:18px; line-height:1;
      }
    `;
  }

  renderToasts() {
    const color = (type) => {

      if (type === 'success') return 'var(--success)';
      if (type === 'danger') return 'var(--danger)';
      return 'var(--primary)';
    };

    this.shadowRoot.querySelector('.toast-wrap').innerHTML = this.toasts
      .map(
        (t) => `
        <div class="toast" role="status" aria-live="polite">
          <div class="dot" style="background:${color(t.type)}"></div>
          <div class="content">
            <div class="title">${escapeHtml(t.title)}</div>
            <div class="msg">${escapeHtml(t.message)}</div>
          </div>
          <button aria-label="Cerrar" type="button" data-id="${t.id}">×</button>
        </div>
      `
      )
      .join('');

    this.shadowRoot.querySelectorAll('button[data-id]').forEach((b) => {
      b.addEventListener('click', () => this.dismiss(b.dataset.id));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>${AcmeToastWrap.styleText}</style>
      <div class="toast-wrap"></div>
    `;

    this.renderToasts();
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '<')
    .replaceAll('>', '>')
    .replaceAll('"', '"')
    .replaceAll("'", '&#039;');
}

customElements.define('acme-toast-wrap', AcmeToastWrap);

