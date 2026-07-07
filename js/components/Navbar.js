export class AcmeNavbar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.render();
    }

    connectedCallback() {
        this.shadowRoot.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.getAttribute('href').replace('#', '');
                window.dispatchEvent(new CustomEvent('route-change', { detail: { route } }));
            });
        });
        
        this.shadowRoot.querySelector('#logout-btn').addEventListener('click', () => {
            window.dispatchEvent(new CustomEvent('logout'));
        });
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    background-color: #1e1e1e;
                    border-bottom: 1px solid #333333;
                    padding: 1rem 2rem;
                }
                nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    max-width: 1200px;
                    margin: 0 auto;
                }
                .logo {
                    font-size: 1.5rem;
                    font-weight: bold;
                    color: #ffffff;
                }
                .links {
                    display: flex;
                    gap: 1.5rem;
                }
                a {
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 0.5rem;
                }
                a:hover {
                    color: #007bff;
                }
                button {
                    background-color: #ff3b30;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    cursor: pointer;
                    font-weight: bold;
                }
                button:hover {
                    background-color: #d32f2f;
                }

                @media (max-width: 600px) {
                    nav {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    .links {
                        flex-direction: column;
                        width: 100%;
                        gap: 0.5rem;
                    }
                    button {
                        width: 100%;
                    }
                }

                @media (min-width: 601px) and (max-width: 1024px) {
                    nav {
                        padding: 0 1rem;
                    }
                }

                @media (min-width: 1025px) {
                    nav {
                        padding: 0;
                    }
                }
            </style>
            <nav>
                <div class="logo">ACME</div>
                <div class="links">
                    <a href="#inventory">Inventario</a>
                    <a href="#production">Producción</a>
                    <a href="#users">Usuarios</a>
                </div>
                <button id="logout-btn">Cerrar Sesión</button>
            </nav>
        `;
    }
}

customElements.define('acme-navbar', AcmeNavbar);
