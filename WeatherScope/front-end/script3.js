const token = localStorage.getItem('token');
const username = localStorage.getItem('username');

if (token && username) {
  // User is authenticated - update navbar
  const loginLink = document.querySelector('a[href="login.html"]');
  const registerLink = document.querySelector('a[href="register.html"]');

  if (loginLink) {
    // Replace "Sign in" with username display
    loginLink.innerHTML = `<i class="bi bi-person-circle me-1"></i>${username}`;
    loginLink.href = '#';
    loginLink.style.cursor = 'default';
    loginLink.style.pointerEvents = 'none';
  }

  if (registerLink) {
    // Replace "Register" with "Quit" link
    registerLink.textContent = 'Quit';
    registerLink.href = '#';
    registerLink.addEventListener('click', (e) => {
      e.preventDefault();
      // Clear all authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('username');
      window.location.href = 'login.html';
    });
  }
} else {
  // User is not authenticated - make sure login/register links are visible
  const loginLink = document.querySelector('a[href="login.html"]');
  const registerLink = document.querySelector('a[href="register.html"]');

  if (loginLink) {
    loginLink.textContent = 'Sign in';
    loginLink.style.display = '';
  }

  if (registerLink) {
    registerLink.textContent = 'Register';
    registerLink.style.display = '';
  }
}
