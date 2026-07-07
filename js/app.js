import { initAuth, checkAuth } from './modules/auth.js';
import { initUsers } from './modules/users.js';
import { initInventory } from './modules/inventory.js';
import { initProduction } from './modules/production.js';

const appContent = document.getElementById('app-content');
const mainHeader = document.getElementById('main-header');


const routes = {
    login: () => {
        mainHeader.style.display = 'none';
        initAuth(appContent);
    },
    inventory: () => {
        if (!checkAuth()) return navigateTo('login');
        mainHeader.style.display = 'block';
        initInventory(appContent);
    },
    production: () => {
        if (!checkAuth()) return navigateTo('login');
        mainHeader.style.display = 'block';
        initProduction(appContent);
    },
    users: () => {
        if (!checkAuth()) return navigateTo('login');
        mainHeader.style.display = 'block';
        initUsers(appContent);
    }
};

function navigateTo(route) {
    if (routes[route]) {
        appContent.innerHTML = '';
        routes[route]();
        window.location.hash = route;
    }
}


window.addEventListener('route-change', (e) => {
    navigateTo(e.detail.route);
});

window.addEventListener('logout', () => {
    localStorage.removeItem('currentUser');
    navigateTo('login');
});

window.addEventListener('hashchange', () => {
    const route = window.location.hash.replace('#', '') || 'login';
    navigateTo(route);
});


document.addEventListener('DOMContentLoaded', () => {
    const initialRoute = window.location.hash.replace('#', '') || 'login';
    
    if(checkAuth() && initialRoute === 'login') {
        navigateTo('inventory');
    } else {
        navigateTo(initialRoute);
    }
});

export { navigateTo };
