(function () {
  'use strict';

  const TOKEN_KEY = 'articleWorkspaceJwt';

  // ── DOM references ──────────────────────────────────────────────
  const uploadForm    = document.getElementById('uploadForm');
  const uploadInput   = document.getElementById('uploadInput');
  const uploadMessage = document.getElementById('uploadMessage');
  const fileGrid      = document.getElementById('fileGrid');
  const uploadBtn     = document.getElementById('uploadBtn');

  // ── Helpers ─────────────────────────────────────────────────────
  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function authHeaders(extra) {
    const token = getToken();
    return Object.assign({}, extra || {}, token ? { Authorization: `Bearer ${token}` } : {});
  }

  function setMessage(text, type) {
    uploadMessage.textContent = text || '';
    uploadMessage.className   = type ? `message ${type}` : 'message';
  }

  function isImage(filename) {
    return /\.(jpe?g|png|gif|webp)$/i.test(filename);
  }

  function formatSize(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  // ── Render file grid ─────────────────────────────────────────────
  function renderFiles(files) {
    if (!fileGrid) return;

    if (!files.length) {
      fileGrid.innerHTML = '<p class="upload-empty">Chưa có file nào được upload.</p>';
      return;
    }

    fileGrid.innerHTML = files.map((file) => {
      const img = isImage(file.filename);
      const preview = img
        ? `<img class="file-thumb" src="${file.url}" alt="${escHtml(file.filename)}" loading="lazy">`
        : `<div class="file-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg><span class="file-type-label">.txt</span></div>`;

      return `
        <div class="file-card" data-filename="${escHtml(file.filename)}">
          <a class="file-preview-link" href="${file.url}" target="_blank" rel="noopener noreferrer" title="Xem file">
            ${preview}
          </a>
          <div class="file-card-body">
            <p class="file-name" title="${escHtml(file.filename)}">${escHtml(file.filename)}</p>
            <div class="file-card-actions">
              <a class="button button-secondary file-dl-btn" href="/upload/download/${encodeURIComponent(file.filename)}" download title="Tải về">↓ Tải về</a>
              <button class="button button-danger file-del-btn" type="button" data-filename="${escHtml(file.filename)}" title="Xóa">Xóa</button>
            </div>
          </div>
        </div>`;
    }).join('');

    // Attach delete listeners
    fileGrid.querySelectorAll('.file-del-btn').forEach((btn) => {
      btn.addEventListener('click', handleDelete);
    });
  }

  function escHtml(str) {
    return String(str ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[c]));
  }

  // ── Load file list ───────────────────────────────────────────────
  async function loadFiles() {
    if (!fileGrid) return;
    fileGrid.innerHTML = '<p class="upload-empty">Đang tải danh sách file...</p>';

    try {
      const res = await fetch('/upload/files', { headers: authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const files = await res.json();
      renderFiles(files);
    } catch (err) {
      fileGrid.innerHTML = '<p class="upload-empty">Không thể tải danh sách file.</p>';
      setMessage('Lỗi khi tải danh sách: ' + err.message, 'error');
    }
  }

  // ── Upload ───────────────────────────────────────────────────────
  async function handleUpload(event) {
    event.preventDefault();

    const file = uploadInput.files[0];
    if (!file) {
      setMessage('Vui lòng chọn một file.', 'error');
      return;
    }

    // Client-side size check (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('File vượt quá giới hạn 5MB.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setMessage('Đang upload...', '');
    uploadBtn.disabled = true;

    try {
      const res = await fetch('/upload/file', {
        method: 'POST',
        headers: authHeaders(),   // Content-Type sẽ được browser tự set với boundary
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload thất bại');

      setMessage(
        `✅ Upload thành công: ${data.originalname} (${formatSize(data.size)})`,
        'success'
      );
      uploadForm.reset();
      await loadFiles();
    } catch (err) {
      setMessage('❌ ' + err.message, 'error');
    } finally {
      uploadBtn.disabled = false;
    }
  }

  // ── Delete ───────────────────────────────────────────────────────
  async function handleDelete(event) {
    const filename = event.currentTarget.dataset.filename;
    if (!filename) return;
    if (!confirm(`Xóa file "${filename}"?`)) return;

    try {
      const res = await fetch(`/upload/delete/${encodeURIComponent(filename)}`, {
        method: 'DELETE',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Xóa thất bại');

      setMessage(`Đã xóa: ${filename}`, 'success');
      await loadFiles();
    } catch (err) {
      setMessage('❌ ' + err.message, 'error');
    }
  }

  // ── Init ─────────────────────────────────────────────────────────
  if (uploadForm) uploadForm.addEventListener('submit', handleUpload);

  const refreshFilesBtn = document.getElementById('refreshFilesBtn');
  if (refreshFilesBtn) refreshFilesBtn.addEventListener('click', loadFiles);

  // Load files nếu đã có token
  if (getToken()) {
    loadFiles();
  } else {
    if (fileGrid) {
      fileGrid.innerHTML = '<p class="upload-empty">Đăng nhập để xem và upload file.</p>';
    }
  }
})();
