class AcmeModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.opened = false;

    this._onKey = (e) => {
      if (e.key === 'Escape') this.close();
    };
  }

  static get observedAttributes() {
    return ['open', 'title'];
  }

  attributeChangedCallback() {
    const isOpen = this.getAttribute('open') === 'true';
    if (isOpen !== this.opened) {
      this.opened = isOpen;
      if (this.opened) this.render();
      else this.closeInternal();
    }
  }

  connectedCallback() {
    if (this.getAttribute('open') === 'true') {
      this.opened = true;
      this.render();
    }
  }

  open() {
    this.setAttribute('open', 'true');
    this.opened = true;
    this.render();
  }

  close() {
    this.setAttribute('open', 'false');
    this.opened = false;
    this.closeInternal();
  }

  closeInternal() {
    if (this.shadowRoot.querySelector('.modal-overlay')) {
      this.shadowRoot.querySelector('.modal-overlay').remove();
    }
    document.removeEventListener('keydown', this._onKey);
  }

  static get styleText() {
    return `
      .modal-overlay{
        position:fixed; inset:0;
        background: rgba(0,0,0,.55);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:16px;
        z-index:9998;
      }
      .modal{
        width:min(720px, 100%);
        border-radius:16px;
        border:1px solid var(--border);
        background: rgba(18,26,45,.97);
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow);
      }
      .modal-header{display:flex; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid rgba(148,163,184,.12)}
      .modal-title{font-weight:1000; font-size:16px}
      .modal-body{padding:16px}
      .modal-actions{display:flex; justify-content:flex-end; gap:10px; padding:0 16px 16px 16px}

      .btn{
        appearance:none;
        border:1px solid var(--border);
        border-radius:12px;
        background: rgba(255,255,255,.03);
        color:var(--text);
        padding:10px 12px;
        font-weight:600;
        cursor:pointer;
        transition: transform .05s ease, background .2s ease, border-color .2s ease;
        font-family: var(--font);
      }
      .btn:hover{background: rgba(255,255,255,.06); border-color: rgba(96,165,250,.45)}
      .btn:active{transform: translateY(1px)}
      .btn:focus{outline:none; box-shadow: var(--focus)}
      .btn-primary{background: rgba(59,130,246,.18); border-color: rgba(59,130,246,.45)}
      .btn-success{background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.45)}
      .btn-danger{background: rgba(251,113,133,.12); border-color: rgba(251,113,133,.45)}
    `;
  }

  render() {
    if (!this.isConnected) return;


    const title = this.getAttribute('title') || '';
    const bodySlot = this.innerHTML;

    this.shadowRoot.innerHTML = `
      <style>${AcmeModal.styleText}</style>
      <div class="modal-overlay" role="dialog" aria-modal="true">

        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">${title}</div>
            <button class="btn" type="button" data-close style="padding:6px 10px">Cerrar</button>
          </div>
          <div class="modal-body">${bodySlot}</div>
          <div class="modal-actions">
            <slot name="actions"></slot>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.querySelector('[data-close]')?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', this._onKey);
  }
}

customElements.define('acme-modal', AcmeModal);

