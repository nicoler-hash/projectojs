class AcmeButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get styleText() {
    return `
      :host{display:inline-block}
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
      .btn-danger{background: rgba(251,113,133,.12); border-color: rgba(251,113,133,.45)}
      .btn-success{background: rgba(52,211,153,.12); border-color: rgba(52,211,153,.45)}
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

