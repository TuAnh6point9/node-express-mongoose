(function() {
  const TOKEN_KEY = 'articleWorkspaceJwt';
  const authForm = document.getElementById('authForm');
  const authMessage = document.getElementById('authMessage');
  const authSubmitButton = document.getElementById('authSubmitButton');
  const showLoginButton = document.getElementById('showLoginButton');
  const showSignupButton = document.getElementById('showSignupButton');

  let authMode = 'login';

  function setMessage(text, type) {
    authMessage.textContent = text || '';
    authMessage.className = type ? `message ${type}` : 'message';
  }

  async function parseResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch (error) {
      return { message: text };
    }
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const body = await parseResponse(response);

    if (!response.ok) {
      throw new Error(body.message || body.error || body.status || 'Request failed');
    }

    return body;
  }

  async function redirectIfTokenIsValid() {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      return;
    }

    try {
      await requestJson('/users/me-jwt', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      window.location.assign('/workspace');
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  function setAuthMode(mode) {
    authMode = mode;
    const isLogin = mode === 'login';

    showLoginButton.classList.toggle('active', isLogin);
    showSignupButton.classList.toggle('active', !isLogin);
    authSubmitButton.textContent = isLogin ? 'Login' : 'Create account';
    setMessage('', '');
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();

    const formData = new FormData(authForm);
    const payload = {
      username: formData.get('username'),
      password: formData.get('password')
    };
    const endpoint = authMode === 'login' ? '/users/login-jwt' : '/users/signup-jwt';

    try {
      const result = await requestJson(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      localStorage.setItem(TOKEN_KEY, result.token);
      setMessage(result.message || 'Authenticated. Redirecting...', 'success');
      window.location.assign('/workspace');
    } catch (error) {
      setMessage(error.message, 'error');
    }
  }

  authForm.addEventListener('submit', handleAuthSubmit);
  showLoginButton.addEventListener('click', () => setAuthMode('login'));
  showSignupButton.addEventListener('click', () => setAuthMode('signup'));
  redirectIfTokenIsValid();
})();
