const token = localStorage.getItem('token');

if (token) {
  const loginLink = document.querySelector('a[href="login.html"]');
  const registerLink = document.querySelector('a[href="register.html"]');

  if (loginLink) loginLink.textContent = 'Sign out';
  if (registerLink) registerLink.style.display = 'none';

  if (loginLink) {
    loginLink.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'login.html';
    });
  }
}
