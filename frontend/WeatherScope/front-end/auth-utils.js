(function() {
  async function checkAuth() {
    try {
      const response = await fetch('/api/v1/clothes/my-selection/', {
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async function getCurrentUser() {
    try {
      const response = await fetch('/api/v1/user/info/', {
        credentials: 'same-origin'
      });

      if (response.ok) {
        const data = await response.json();
        return data.username;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async function updateNavigation() {
    const nav = document.querySelector('header nav');
    if (!nav) return;

    const username = await getCurrentUser();

    if (username) {
      nav.innerHTML = `
        <span class="text-white me-3">👤 ${username}</span>
        <a class="text-white text-decoration-none me-3" href="/static/clothes.html">My Clothes</a>
        <a class="text-white text-decoration-none me-3" href="/static/settings.html">Settings</a>
        <a class="text-white text-decoration-none" href="#" id="logout-btn">Logout</a>
      `;

      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
          e.preventDefault();
          await fetch('/api/v1/logout/', { credentials: 'same-origin' });
          window.location.href = '/static/login.html';
        });
      }
    } else {
      nav.innerHTML = `
        <a class="text-white text-decoration-none me-3" href="/static/login.html">Login</a>
        <a class="text-white text-decoration-none me-3" href="/static/register.html">Register</a>
        <a class="text-white text-decoration-none" href="/static/settings.html">Settings</a>
      `;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNavigation);
  } else {
    updateNavigation();
  }

  window.WeatherScopeAuth = {
    checkAuth,
    getCurrentUser,
    updateNavigation
  };
})();

