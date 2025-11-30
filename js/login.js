// ...existing code...
(function () {
    const ADMIN_EMAIL = "floresyemile45@gmail.com";
    const ADMIN_PASS = "#Km18";

    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const loginMsg = document.getElementById('login-msg');
    const indexContent = document.getElementById('index-content');
    const userInfo = document.getElementById('user-info');
    const userNameSpan = document.getElementById('user-name');
    const logoutBtn = document.getElementById('logout-btn');

    function showLogin() {
        loginSection.classList.remove('hidden');
        indexContent.classList.add('hidden');
        userInfo.classList.add('hidden');
    }

    function showIndexForClient(name, email) {
        loginSection.classList.add('hidden');
        indexContent.classList.remove('hidden');
        userInfo.classList.remove('hidden');
        userNameSpan.textContent = name + " (" + email + ")";
    }

    function redirectToEmpresa() {
        window.location.href = "empresa.html";
    }

    function redirectToAdmin() {
        window.location.href = "admi.html";
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        loginMsg.textContent = "";

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const role = document.getElementById('role').value;

        if (!name || !email || !password || !role) {
            loginMsg.textContent = "Completa todos los campos.";
            return;
        }

        // Admin check (credenciales exactas)
        if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
            sessionStorage.setItem('userRole', 'admin');
            sessionStorage.setItem('userName', name);
            sessionStorage.setItem('userEmail', email);
            redirectToAdmin();
            return;
        }

        // Empresa
        if (role === 'empresa') {
            // Aquí podrías añadir validaciones reales para empresas
            sessionStorage.setItem('userRole', 'empresa');
            sessionStorage.setItem('userName', name);
            sessionStorage.setItem('userEmail', email);
            redirectToEmpresa();
            return;
        }

        // Cliente
        if (role === 'cliente') {
            sessionStorage.setItem('userRole', 'cliente');
            sessionStorage.setItem('userName', name);
            sessionStorage.setItem('userEmail', email);
            showIndexForClient(name, email);
            return;
        }

        loginMsg.textContent = "Rol no reconocido.";
    });

    logoutBtn.addEventListener('click', function () {
        sessionStorage.clear();
        showLogin();
    });

    // Auto-estado al cargar la página
    (function initFromSession() {
        const role = sessionStorage.getItem('userRole');
        const name = sessionStorage.getItem('userName');
        const email = sessionStorage.getItem('userEmail');

        if (!role) {
            showLogin();
            return;
        }

        if (role === 'admin') {
            redirectToAdmin();
            return;
        }
        if (role === 'empresa') {
            redirectToEmpresa();
            return;
        }
        if (role === 'cliente') {
            showIndexForClient(name || 'Cliente', email || '');
            return;
        }

        showLogin();
    })();
})();