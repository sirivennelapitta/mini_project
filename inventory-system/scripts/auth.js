// Handle Registration
document.getElementById('registerForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const user = {
        email: document.getElementById('regEmail').value,
        password: document.getElementById('regPassword').value
    };
    
    localStorage.setItem('user', JSON.stringify(user));
    window.location.href = 'index.html';
});

// Handle Login
document.getElementById('loginForm')?.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const storedUser = JSON.parse(localStorage.getItem('user'));

    if(storedUser && storedUser.email === email && storedUser.password === password) {
        localStorage.setItem('isAuthenticated', 'true');
        window.location.href = 'dashboard.html';
    } else {
        alert('Invalid credentials!');
    }
});

// Logout
function logout() {
    localStorage.removeItem('isAuthenticated');
    window.location.href = 'index.html';
}