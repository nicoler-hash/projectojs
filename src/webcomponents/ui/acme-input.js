class AcmeInput extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['label', 'placeholder', 'type', 'name', 'value', 'required'];
  }

  attributeChangedCallback() {
    this.render();
  }

  get value() {
    return this._input?.value ?? '';
  }

  static get styleText() {
    return `
      :host{display:block}
      .input{
        width:100%;
        padding:10px 12px;
        border-radius:12px;
        border:1px solid var(--border);
        background: rgba(15,23,42,.55);
        color:var(--text);
        font-family: var(--font);
      }
      .input::placeholder{color: rgba(148,163,184,.8)}
      .input:focus{outline:none; box-shadow: var(--focus); border-color: rgba(96,165,250,.55)}
      .label{font-size:13px; color: var(--muted); font-weight:700; margin-bottom:6px;}
      .col{display:flex; flex-direction:column; gap:6px}
    `;
  }

  render() {
    const label = this.getAttribute('label') || '';

    const placeholder = this.getAttribute('placeholder') || '';
    const type = this.getAttribute('type') || 'text';
    const name = this.getAttribute('name') || '';
    const required = this.getAttribute('required') === 'true';
    const value = this.getAttribute('value') ?? '';

    this.shadowRoot.innerHTML = `
      <style>${AcmeInput.styleText}</style>
      <div class="col" style="gap:6px">
        ${label ? `<div class="label">${label}</div>` : ''}
        <input class="input" type="${type}" placeholder="${escapeHtml(placeholder)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" ${required ? 'required' : ''}/>
      </div>
    `;


    this._input = this.shadowRoot.querySelector('input');
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

customElements.define('acme-input', AcmeInput);

