import { commonUiCss } from '../../lib/common-ui-css.js';

class AcmeButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get styleText() {
    return `
      ${commonUiCss()}
      :host{display:inline-block}
    `;
  }


  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const variant = this.getAttribute('variant') || 'default';
    const disabled = this.getAttribute('disabled') === 'true';

    const cls = variant === 'primary' ? 'btn btn-primary' : variant === 'danger' ? 'btn btn-danger' : variant === 'success' ? 'btn btn-success' : 'btn';

    this.shadowRoot.innerHTML = `
      <style>${AcmeButton.styleText}</style>
      <button class="${cls}" type="button" ${disabled ? 'disabled' : ''}><slot></slot></button>
    `;


    const b = this.shadowRoot.querySelector('button');
    b.addEventListener('click', (e) => {
      this.dispatchEvent(new CustomEvent('click', { detail: e }));
    });
  }
}

customElements.define('acme-button', AcmeButton);

