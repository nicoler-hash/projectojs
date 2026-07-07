import { commonUiCss } from '../../lib/common-ui-css.js';

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
      ${commonUiCss()}
      .col{gap:6px}
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

