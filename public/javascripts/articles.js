(function() {
  const TOKEN_KEY = 'articleWorkspaceJwt';
  const logoutButton = document.getElementById('logoutButton');
  const sessionStatus = document.getElementById('sessionStatus');
  const articleForm = document.getElementById('articleForm');
  const articleFormTitle = document.getElementById('articleFormTitle');
  const articleIdInput = document.getElementById('articleId');
  const saveArticleButton = document.getElementById('saveArticleButton');
  const cancelEditButton = document.getElementById('cancelEditButton');
  const articleMessage = document.getElementById('articleMessage');
  const articleList = document.getElementById('articleList');
  const refreshButton = document.getElementById('refreshButton');

  function todayInputValue() {
    return new Date().toISOString().slice(0, 10);
  }

  function setMessage(element, text, type) {
    element.textContent = text || '';
    element.className = type ? `message ${type}` : 'message';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[character]));
  }

  async function parseResponse(response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch (error) {
      return { message: text };
    }
  }

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders(extraHeaders) {
    const token = getToken();

    return Object.assign(
      {},
      extraHeaders || {},
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  async function requestJson(url, options) {
    const response = await fetch(url, options);
    const body = await parseResponse(response);

    if (!response.ok) {
      throw new Error(body.message || body.error || body.status || 'Request failed');
    }

    return body;
  }

  async function refreshTokenSession() {
    const token = getToken();

    if (!token) {
      return false;
    }

    try {
      const result = await requestJson('/users/me-jwt', {
        headers: authHeaders()
      });

      if (result.authenticated && result.user) {
        sessionStatus.textContent = `Signed in with token as ${result.user.username}`;
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  function resetArticleForm() {
    articleIdInput.value = '';
    articleFormTitle.textContent = 'Create article';
    saveArticleButton.textContent = 'Create article';
    cancelEditButton.hidden = true;
    articleForm.reset();
    articleForm.elements.date.value = todayInputValue();
    articleForm.elements.title.value = 'Morning Article';
    articleForm.elements.tags.value = 'news, express';
    articleForm.elements.text.value = 'Article text must be longer than ten characters.';
    articleForm.elements.comment.value = 'Reviewed from web UI';
  }

  function buildArticlePayload(includeComment) {
    const formData = new FormData(articleForm);
    const tags = String(formData.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const comment = String(formData.get('comment') || '').trim();
    const payload = {
      title: formData.get('title'),
      date: formData.get('date'),
      text: formData.get('text'),
      tags
    };

    if (includeComment && comment) {
      payload.comments = [{ body: comment }];
    }

    return payload;
  }

  function renderArticles(articles) {
    if (!articles.length) {
      articleList.innerHTML = '<p class="empty-state">No articles yet. Create the first one from the form.</p>';
      return;
    }

    articleList.innerHTML = articles.map((article) => {
      const tags = Array.isArray(article.tags) ? article.tags : [];
      const date = article.date ? new Date(article.date).toLocaleDateString() : 'No date';

      return `
        <article class="article-card" data-id="${escapeHtml(article._id)}">
          <div class="article-card-header">
            <div>
              <h3>${escapeHtml(article.title)}</h3>
              <div class="article-meta">${escapeHtml(date)}</div>
            </div>
            <div class="article-actions">
              <button class="button button-secondary" type="button" data-action="edit">Edit</button>
              <button class="button button-danger" type="button" data-action="delete">Delete</button>
            </div>
          </div>
          <p class="article-text">${escapeHtml(article.text)}</p>
          <div class="tag-row">
            ${tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
          </div>
        </article>
      `;
    }).join('');
  }

  async function loadArticles() {
    articleList.innerHTML = '<p class="empty-state">Loading articles...</p>';

    try {
      const articles = await requestJson('/api/articles', {
        headers: authHeaders()
      });
      renderArticles(articles);
      setMessage(articleMessage, '', '');
    } catch (error) {
      if (error.message.includes('JWT token') || error.message.includes('Unauthorized')) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.assign('/');
        return;
      }

      articleList.innerHTML = '<p class="empty-state">Could not load articles.</p>';
      setMessage(articleMessage, error.message, 'error');
    }
  }

  async function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    window.location.assign('/');
  }

  async function handleArticleSubmit(event) {
    event.preventDefault();
    const articleId = articleIdInput.value;
    const isEditing = Boolean(articleId);
    const payload = buildArticlePayload(!isEditing);

    try {
      await requestJson(isEditing ? `/api/articles/${articleId}` : '/api/articles', {
        method: isEditing ? 'PUT' : 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      setMessage(articleMessage, isEditing ? 'Article updated.' : 'Article created.', 'success');
      resetArticleForm();
      await loadArticles();
    } catch (error) {
      setMessage(articleMessage, error.message, 'error');
    }
  }

  async function handleArticleListClick(event) {
    const button = event.target.closest('button[data-action]');

    if (!button) {
      return;
    }

    const card = button.closest('.article-card');
    const articleId = card && card.dataset.id;

    if (!articleId) {
      return;
    }

    if (button.dataset.action === 'delete') {
      try {
        await requestJson(`/api/articles/${articleId}`, {
          method: 'DELETE',
          headers: authHeaders()
        });
        setMessage(articleMessage, 'Article deleted.', 'success');
        await loadArticles();
      } catch (error) {
        setMessage(articleMessage, error.message, 'error');
      }
      return;
    }

    try {
      const article = await requestJson(`/api/articles/${articleId}`, {
        headers: authHeaders()
      });
      articleIdInput.value = article._id;
      articleFormTitle.textContent = 'Edit article';
      saveArticleButton.textContent = 'Update article';
      cancelEditButton.hidden = false;
      articleForm.elements.title.value = article.title || '';
      articleForm.elements.date.value = article.date ? new Date(article.date).toISOString().slice(0, 10) : todayInputValue();
      articleForm.elements.tags.value = Array.isArray(article.tags) ? article.tags.join(', ') : '';
      articleForm.elements.text.value = article.text || '';
      articleForm.elements.comment.value = '';
      articleForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
      setMessage(articleMessage, error.message, 'error');
    }
  }

  logoutButton.addEventListener('click', handleLogout);
  articleForm.addEventListener('submit', handleArticleSubmit);
  cancelEditButton.addEventListener('click', resetArticleForm);
  refreshButton.addEventListener('click', loadArticles);
  articleList.addEventListener('click', handleArticleListClick);

  resetArticleForm();
  refreshTokenSession().then((authenticated) => {
    if (!authenticated) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.assign('/');
      return;
    }

    loadArticles();
  });
})();
