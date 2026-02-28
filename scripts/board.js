
const storage = {
  // Private board notes (user created)
  getPrivate: () => JSON.parse(localStorage.getItem('privateBoard') || '[]'),
  setPrivate: (data) => localStorage.setItem('privateBoard', JSON.stringify(data)),
  
  // Public board (items from feed)
  getPublic: () => {
    const liked = JSON.parse(localStorage.getItem('likedMemories') || '[]');
    const pinned = JSON.parse(localStorage.getItem('pinnedMemories') || '[]');
    return { liked, pinned };
  },
  
  // Get feed items that are liked or pinned
  getPublicItems: async () => {
    const { liked, pinned } = storage.getPublic();
    const allIds = [...new Set([...liked, ...pinned])];
    
    try {
      const response = await fetch('../notes.json');
      const allMemories = await response.json();
      return allMemories.filter(m => allIds.includes(m.id));
    } catch (error) {
      console.error('Error loading feed items:', error);
      return [];
    }
  }
};

// ============================================
// HELPERS
// ============================================

const $ = (sel) => document.querySelector(sel);
const esc = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

const colors = ['#F9CAD5', '#B3E5FC', '#FFF9C4', '#C8E6C9', '#FFEAD3'];
const rotations = ['rotate-neg-2', 'rotate-neg-1', '', 'rotate-pos-1', 'rotate-pos-2'];
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];

const formatDate = (ts) => {
  const diff = Date.now() - new Date(ts);
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ============================================
// CURRENT BOARD STATE
// ============================================

let currentBoard = 'private'; // 'private' or 'public'
let currentMedia = null;

// ============================================
// RENDER PRIVATE BOARD ITEMS
// ============================================

const renderPrivateNote = (item) => `
  <div class="postit-card" style="background: ${item.color}">
    <p class="handwriting">${esc(item.content)}</p>
    <button class="delete-item-btn" onclick="deletePrivateItem('${item.id}')">
      <span class="material-icons">close</span>
    </button>
  </div>
`;

const renderPrivatePhoto = (item) => `
  <div class="polaroid-card">
    <div class="washi-tape"></div>
    <img src="${esc(item.url)}" class="polaroid-image" alt="Photo">
    ${item.caption ? `<p class="handwriting text-center">${esc(item.caption)}</p>` : ''}
    <span class="polaroid-date">${formatDate(item.timestamp)}</span>
    <button class="delete-item-btn" onclick="deletePrivateItem('${item.id}')">
      <span class="material-icons">close</span>
    </button>
  </div>
`;

const renderPrivateLink = (item) => `
  <div class="postit-card" style="background: #B3E5FC">
    <h3 class="marker-title">
      <a href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none">
        ${esc(item.title || 'Link')}
        <span class="material-icons" style="font-size:16px;vertical-align:middle">open_in_new</span>
      </a>
    </h3>
    ${item.description ? `<p class="handwriting">${esc(item.description)}</p>` : ''}
    ${item.caption ? `<p class="handwriting" style="margin-top:8px;font-size:14px;color:rgba(0,0,0,0.6)">${esc(item.caption)}</p>` : ''}
    <button class="delete-item-btn" onclick="deletePrivateItem('${item.id}')">
      <span class="material-icons">close</span>
    </button>
  </div>
`;

const renderPrivateItem = (item) => {
  const div = document.createElement('div');
  div.className = `masonry-item ${rand(rotations)}`;
  div.dataset.itemId = item.id;
  
  const renderers = {
    note: renderPrivateNote,
    photo: renderPrivatePhoto,
    link: renderPrivateLink
  };
  
  div.innerHTML = renderers[item.type](item);
  return div;
};

const renderPrivateBoard = () => {
  const grid = $('#private-grid');
  const items = storage.getPrivate();
  
  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem">
        <span class="material-icons" style="font-size:80px;color:var(--color-primary);opacity:0.5">edit_note</span>
        <h2 class="marker-title" style="margin-top:1rem;font-size:2rem">Your Private Board</h2>
        <p class="handwriting" style="font-size:1.25rem;color:rgba(0,0,0,0.6)">
          Create notes, add photos and music to capture your personal memories!
        </p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(renderPrivateItem(item)));
};

// ============================================
// RENDER PUBLIC BOARD ITEMS (FROM FEED)
// ============================================

const renderPublicItem = (memory) => {
  const div = document.createElement('div');
  div.className = `masonry-item ${memory.rotation}`;
  div.dataset.itemId = memory.id;
  
  let html = '';
  
  switch (memory.type) {
    case 'polaroid':
      html = `
        <div class="polaroid-card">
          <div class="washi-tape"></div>
          <img src="${memory.image}" class="polaroid-image" alt="Photo">
          <p class="handwriting text-center">${memory.caption}</p>
          <span class="polaroid-date">${memory.date}</span>
        </div>
      `;
      break;
      
    case 'postit':
      html = `
        <div class="postit-card">
          ${memory.title ? `<h3 class="marker-title">${memory.title}</h3>` : ''}
          <p class="handwriting">${memory.content}</p>
        </div>
      `;
      break;
      
    case 'cassette':
      html = `
        <div class="cassette-card">
          <div class="cassette-body">
            <button class="play-button" data-audio="${memory.audioSrc}">
              <span class="material-icons">play_arrow</span>
            </button>
          </div>
          <div class="cassette-footer">
            <span class="marker-small">${memory.fileName}</span>
            <span class="duration">${memory.duration}</span>
          </div>
        </div>
      `;
      break;
  }
  
  div.innerHTML = html;
  return div;
};

const renderPublicBoard = async () => {
  const grid = $('#public-grid');
  const items = await storage.getPublicItems();
  
  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:4rem 2rem">
        <span class="material-icons" style="font-size:80px;color:var(--color-primary);opacity:0.5">favorite_border</span>
        <p class="handwriting" style="font-size:1.25rem;color:rgba(0,0,0,0.6)">
          Visit the feed and like or pin memories to see them here!
        </p>
        <a href="feed.html" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex;align-items:center;gap:8px;text-decoration:none">
          <span class="material-icons">explore</span>
          Go to Feed
        </a>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = '';
  items.forEach(item => grid.appendChild(renderPublicItem(item)));
};

// ============================================
// BOARD TOGGLE
// ============================================

const toggleBoard = (boardType) => {
  currentBoard = boardType;
  
  // Update toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    if (btn.dataset.board === boardType) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // Show/hide boards
  if (boardType === 'private') {
    $('#private-board').style.display = 'block';
    $('#public-board').style.display = 'none';
    $('#share-btn').style.display = 'flex';
  } else {
    $('#private-board').style.display = 'none';
    $('#public-board').style.display = 'block';
    $('#share-btn').style.display = 'none';
  }
};

// ============================================
// CREATE PRIVATE NOTE
// ============================================

const showMediaPreview = (type, url, name) => {
  const previews = {
    photo: `<img src="${url}" style="max-width:100%;max-height:200px;border-radius:8px"><p class="handwriting">📷 Photo attached</p>`,
    link: `<div style="padding:16px;background:#B3E5FC;border-radius:8px"><span class="material-icons" style="vertical-align:middle">link</span> <strong>${esc(name)}</strong><p style="font-size:12px;margin-top:4px;word-break:break-all">${esc(url)}</p></div>`
  };
  
  $('.preview-content').innerHTML = previews[type];
  $('.media-preview-area').style.display = 'block';
};

const clearMediaPreview = () => {
  currentMedia = null;
  $('.media-preview-area').style.display = 'none';
  $('.preview-content').innerHTML = '';
  $('#photo-upload').value = '';
};

const handleFileUpload = async (e, type) => {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file size (5MB for photos)
  const maxSize = 5 * 1024 * 1024;
  
  if (file.size > maxSize) {
    alert('File too large. Max size: 5MB');
    e.target.value = '';
    return;
  }
  
  // Convert to base64
  const url = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.readAsDataURL(file);
  });
  
  currentMedia = { type: 'photo', url, title: file.name };
  showMediaPreview('photo', url, file.name);
};

const showLinkModal = () => {
  const modal = $('#link-modal');
  modal.style.display = 'flex';
  
  const closeBtn = $('.modal-close-link');
  const cancelBtn = $('#link-cancel-btn');
  const submitBtn = $('#link-submit-btn');
  
  const closeModal = () => {
    modal.style.display = 'none';
    $('#link-url').value = '';
    $('#link-title').value = '';
    $('#link-description').value = '';
  };
  
  closeBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;
  modal.onclick = (e) => e.target === modal && closeModal();
  
  submitBtn.onclick = () => {
    const url = $('#link-url').value.trim();
    const title = $('#link-title').value.trim();
    const description = $('#link-description').value.trim();
    
    if (!url) {
      alert('Please enter a URL');
      return;
    }
    
    try {
      new URL(url);
      currentMedia = { 
        type: 'link', 
        url, 
        title: title || url, 
        description 
      };
      showMediaPreview('link', url, title || 'Link');
      closeModal();
    } catch {
      alert('Please enter a valid URL');
    }
  };
};

const createPrivateNote = () => {
  const content = $('.create-note-card textarea').value.trim();
  
  if (!content && !currentMedia) {
    alert('Please write something or attach media!');
    return;
  }
  
  const items = storage.getPrivate();
  
  const newItem = currentMedia
    ? {
        ...currentMedia,
        caption: content,
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      }
    : {
        type: 'note',
        content: content,
        color: rand(colors),
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString()
      };
  
  items.unshift(newItem);
  storage.setPrivate(items);
  
  // Clear form
  $('.create-note-card textarea').value = '';
  clearMediaPreview();
  
  // Re-render
  renderPrivateBoard();
};

// ============================================
// DELETE PRIVATE ITEM
// ============================================

window.deletePrivateItem = (id) => {
  if (!confirm('Delete this item?')) return;
  
  const items = storage.getPrivate();
  const filtered = items.filter(item => item.id !== id);
  storage.setPrivate(filtered);
  renderPrivateBoard();
};

// ============================================
// SEARCH
// ============================================

const searchBoard = (query) => {
  if (!query.trim()) {
    if (currentBoard === 'private') {
      renderPrivateBoard();
    } else {
      renderPublicBoard();
    }
    return;
  }
  
  const q = query.toLowerCase();
  
  if (currentBoard === 'private') {
    const items = storage.getPrivate();
    const results = items.filter(item => 
      [item.content, item.caption, item.title].some(text => 
        text?.toLowerCase().includes(q)
      )
    );
    
    const grid = $('#private-grid');
    if (results.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem"><p class="handwriting">No results found</p></div>`;
      return;
    }
    grid.innerHTML = '';
    results.forEach(item => grid.appendChild(renderPrivateItem(item)));
  } else {
    // Search public board
    storage.getPublicItems().then(items => {
      const results = items.filter(item =>
        [item.content, item.caption, item.title].some(text =>
          text?.toLowerCase().includes(q)
        )
      );
      
      const grid = $('#public-grid');
      if (results.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:4rem"><p class="handwriting">No results found</p></div>`;
        return;
      }
      grid.innerHTML = '';
      results.forEach(item => grid.appendChild(renderPublicItem(item)));
    });
  }
};

// ============================================
// SHARE BOARD
// ============================================

const showShareModal = () => {
  const modal = $('#share-modal');
  modal.style.display = 'flex';
  
  $('.modal-close').onclick = () => modal.style.display = 'none';
  $('#share-cancel-btn').onclick = () => modal.style.display = 'none';
  modal.onclick = (e) => e.target === modal && (modal.style.display = 'none');
  
  $('#copy-link-btn').onclick = () => {
    const link = $('#share-link');
    link.select();
    document.execCommand('copy');
    alert('Link copied to clipboard!');
  };
  
  $('#share-send-btn').onclick = () => {
    const email = $('#share-email').value.trim();
    if (!email) {
      alert('Please enter an email address');
      return;
    }
    alert(`Invitation sent to ${email}!`);
    modal.style.display = 'none';
    $('#share-email').value = '';
  };
};

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Render initial board
  renderPrivateBoard();
  
  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.onclick = () => {
      toggleBoard(btn.dataset.board);
      if (btn.dataset.board === 'public') {
        renderPublicBoard();
      }
    };
  });
  
  // Create note button
  $('#pin-note-btn').onclick = createPrivateNote;
  
  // File upload
  $('#photo-upload').onchange = (e) => handleFileUpload(e, 'photo');
  
  // Link button
  $('#add-link-btn').onclick = showLinkModal;
  
  // Remove media button
  $('.remove-media-btn').onclick = clearMediaPreview;
  
  // Share button
  $('#share-btn').onclick = showShareModal;
  
  // Search
  $('#search-input').oninput = (e) => searchBoard(e.target.value);
  
  // Keyboard shortcut
  $('.create-note-card textarea').onkeydown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      createPrivateNote();
    }
  };
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .board-toggle-section{display:flex;justify-content:space-between;align-items:center;margin-bottom:2rem;padding:1rem;background:white;border-radius:16px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
    .toggle-container{display:flex;gap:8px;background:#f5f5f5;padding:4px;border-radius:12px}
    .toggle-btn{background:transparent;border:none;padding:12px 24px;border-radius:8px;display:flex;align-items:center;gap:8px;cursor:pointer;font-family:'Kalam',cursive;font-size:16px;transition:0.2s}
    .toggle-btn:hover{background:rgba(234,123,123,0.1)}
    .toggle-btn.active{background:var(--color-primary,#EE2B6C);color:white}
    .share-board-btn{display:flex;align-items:center;gap:8px}
    .icon-btn{background:transparent;border:none;padding:8px;cursor:pointer;border-radius:8px;transition:0.2s}
    .icon-btn:hover{background:rgba(234,123,123,0.1)}
    .icon-btn .material-icons{color:var(--color-primary,#EE2B6C);font-size:24px}
    .note-icons{display:flex;gap:4px}
    .media-preview-area{position:relative;margin-top:16px;padding:16px;background:rgba(249,202,213,0.1);border-radius:12px;border:2px dashed rgba(234,123,123,0.3)}
    .preview-content{text-align:center}
    .remove-media-btn{position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.95);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.15)}
    .remove-media-btn:hover{background:#f44336;color:white}
    .delete-item-btn{position:absolute;top:8px;right:8px;background:rgba(255,255,255,0.95);border:none;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:0.2s;z-index:10}
    .masonry-item:hover .delete-item-btn{opacity:1}
    .delete-item-btn:hover{background:#f44336;color:white}
    .public-board-header{text-align:center;margin-bottom:3rem}
    .public-board-header h2{font-size:2.5rem;margin-bottom:0.5rem}
    .public-board-header p{font-size:1.25rem;color:rgba(0,0,0,0.6)}
    .modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000}
    .modal-content{background:white;border-radius:16px;max-width:500px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3)}
    .modal-header{padding:24px;border-bottom:2px solid #f5f5f5;display:flex;justify-content:space-between;align-items:center}
    .modal-close{background:transparent;border:none;cursor:pointer;padding:8px;border-radius:50%}
    .modal-close:hover{background:rgba(234,123,123,0.1)}
    .modal-body{padding:24px}
    .form-group{margin-bottom:20px}
    .form-group label{display:block;font-family:'Permanent Marker',cursive;font-size:14px;margin-bottom:8px;color:var(--color-primary,#EE2B6C)}
    .form-group input{width:100%;padding:12px 16px;border:2px solid #f0f0f0;border-radius:12px;font-family:'Kalam',cursive;font-size:16px;outline:none}
    .form-group textarea{width:100%;padding:12px 16px;border:2px solid #f0f0f0;border-radius:12px;font-family:'Kalam',cursive;font-size:16px;outline:none;resize:vertical}
    .form-group input:focus,.form-group textarea:focus{border-color:var(--color-primary,#EE2B6C)}
    .share-link-container{margin-top:20px}
    .link-copy-box{display:flex;gap:8px;margin-top:8px}
    .link-copy-box input{flex:1}
    .link-copy-box button{padding:12px 16px}
    .modal-footer{padding:16px 24px;border-top:2px solid #f5f5f5;display:flex;gap:12px;justify-content:flex-end}
    .btn-outline{background:white;border:2px solid var(--color-primary,#EE2B6C);color:var(--color-primary,#EE2B6C)}
    .btn-outline:hover{background:rgba(234,123,123,0.1)}
    .nav-link{display:flex;align-items:center;gap:4px;text-decoration:none;color:var(--color-primary,#EE2B6C);font-family:'Kalam',cursive;padding:8px 16px;border-radius:8px;transition:0.2s}
    .nav-link:hover{background:rgba(234,123,123,0.1)}
  `;
  document.head.appendChild(style);
  
  console.log('💕 Board ready!');
});