const API_BASE_URL = '/api';
const baseUrl = import.meta.env.BASE_URL;
const pageUrl = (page) => `${baseUrl}${page}`;
const assetUrl = (path) => `${baseUrl}${path}`;

// Protect admin panel - redirect non-admin users
function checkAdminAccess() {
  const adminToken = localStorage.getItem('adminToken');
  const userData = JSON.parse(localStorage.getItem('userData'));
  
  // If user is not an admin, redirect them away
  if (!adminToken) {
    // If they're a regular user, redirect to home
    if (userData) {
      window.location.href = pageUrl('index.html');
      return;
    }
    // If they're not logged in, let the login form show
  }
}

// Check access immediately when page loads
checkAdminAccess();

document.addEventListener('DOMContentLoaded', () => {
  // Bootstrap Modals
  const editProductModalEl = document.getElementById('editProductModal');
  const editBlogModalEl = document.getElementById('editBlogModal');
  const editProductModal = editProductModalEl ? new bootstrap.Modal(editProductModalEl) : null;
  const editBlogModal = editBlogModalEl ? new bootstrap.Modal(editBlogModalEl) : null;

  // Sections
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');

  // Forms
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const addProductForm = document.getElementById('add-product-form');
  const addBlogForm = document.getElementById('add-blog-form');
  const editProductForm = document.getElementById('edit-product-form');
  const editBlogForm = document.getElementById('edit-blog-form');

  // Toggles & Buttons
  const toggleRegister = document.getElementById('toggle-register');
  const toggleLogin = document.getElementById('toggle-login');
  const logoutBtn = document.getElementById('logout-btn');
  const addAdminBtn = document.getElementById('add-admin-btn');
  const saveEditBtn = document.getElementById('save-edit-btn');
  const saveEditBlogBtn = document.getElementById('save-edit-blog-btn');

  // Lists
  const productsList = document.getElementById('products-list');
  const blogsList = document.getElementById('blogs-list');
  const usersList = document.getElementById('users-list');
  const adminsList = document.getElementById('admins-list');

  // State
  let token = localStorage.getItem('adminToken');
  let currentAdmin = JSON.parse(localStorage.getItem('adminData'));

  // --- Authentication ---

  function updateUI() {
    if (token) {
      loginSection.style.display = 'none';
      dashboardSection.style.display = 'block';
      document.body.style.background = '#f8f9fa';
      document.getElementById('admin-name').textContent = `Welcome, ${currentAdmin?.name || 'Admin'}`;
      loadAllData();
    } else {
      loginSection.style.display = 'flex';
      dashboardSection.style.display = 'none';
      document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }

  if (toggleRegister) toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  if (toggleLogin) toggleLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  if (addAdminBtn) addAdminBtn.addEventListener('click', () => {
    dashboardSection.style.display = 'none';
    loginSection.style.display = 'flex';
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  if (registerForm) registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const name = document.getElementById('register-name').value;
    const errorDiv = document.getElementById('register-error');
    const successDiv = document.getElementById('register-success');

    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ email, password, name })
      });

      const data = await response.json();
      if (response.ok) {
        successDiv.textContent = 'Registration successful! You can now login.';
        successDiv.style.display = 'block';
        registerForm.reset();
        setTimeout(() => {
          if (token) {
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
            updateUI();
          } else if (toggleLogin) {
            toggleLogin.click();
          }
        }, 2000);
      } else {
        errorDiv.textContent = data.error || 'Registration failed';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Connection error';
      errorDiv.style.display = 'block';
    }
  });

  if (loginForm) loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.style.display = 'none';

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      if (response.ok) {
        token = data.token;
        currentAdmin = data.admin;
        localStorage.removeItem('userData');
        localStorage.removeItem('userToken');
        localStorage.setItem('adminToken', token);
        localStorage.setItem('adminData', JSON.stringify(currentAdmin));
        updateUI();
      } else {
        errorDiv.textContent = data.error || 'Login failed';
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      errorDiv.textContent = 'Connection error';
      errorDiv.style.display = 'block';
    }
  });

  if (logoutBtn) logoutBtn.addEventListener('click', () => {
    token = null;
    currentAdmin = null;
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    updateUI();
  });

  // --- Data Loading & Helpers ---

  function loadAllData() {
    loadProducts();
    loadBlogs();
    loadUsers();
    loadAdmins();
  }

  async function authenticatedFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const response = await fetch(url, options);
    if (response.status === 401 || response.status === 403) {
      console.warn('Auth failed, logging out');
      logoutBtn.click();
      throw new Error('Session expired');
    }
    return response;
  }

  // --- Products ---

  async function loadProducts() {
    try {
      console.log('Loading products...');
      const response = await fetch(`${API_BASE_URL}/products`);
      const products = await response.json();
      if (!productsList) return;
      productsList.innerHTML = '';
      products.forEach(product => {
        const div = document.createElement('div');
        div.className = 'list-group-item product-item';
        div.innerHTML = `
          <div class="product-info">
            <img src="${product.image}" alt="${product.name}" class="me-3" onerror="this.src='${assetUrl('images/snack_product.png')}'">
            <div>
              <h6 class="mb-0">${product.name}</h6>
              <p class="mb-0 text-muted" style="font-size: 0.85rem;">₹${product.price.toFixed(2)} | ${product.description || ''}</p>
            </div>
          </div>
          <div class="product-actions">
            <button class="btn btn-sm btn-primary edit-product-btn" data-id="${product.id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-product-btn" data-id="${product.id}">Delete</button>
          </div>
        `;
        productsList.appendChild(div);
      });

      // Use event delegation for delete and edit
      productsList.onclick = (e) => {
        const deleteBtn = e.target.closest('.delete-product-btn');
        const editBtn = e.target.closest('.edit-product-btn');
        if (deleteBtn) deleteProduct(deleteBtn.dataset.id);
        if (editBtn) openEditProductModal(editBtn.dataset.id);
      };
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  if (addProductForm) addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('description', document.getElementById('product-desc').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('image', document.getElementById('product-image').files[0]);

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        addProductForm.reset();
        loadProducts();
      } else {
        const data = await response.json();
        alert('Failed to add product: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  });

  async function openEditProductModal(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/products`);
      const products = await response.json();
      const product = products.find(p => p.id == id);
      if (product && editProductModal) {
        document.getElementById('edit-product-id').value = product.id;
        document.getElementById('edit-product-name').value = product.name;
        document.getElementById('edit-product-desc').value = product.description;
        document.getElementById('edit-product-price').value = product.price;
        document.getElementById('edit-product-category').value = product.category;
        editProductModal.show();
      }
    } catch (error) {
      console.error('Error opening product modal:', error);
    }
  }

  if (saveEditBtn) saveEditBtn.addEventListener('click', async () => {
    const id = document.getElementById('edit-product-id').value;
    const formData = new FormData();
    formData.append('name', document.getElementById('edit-product-name').value);
    formData.append('description', document.getElementById('edit-product-desc').value);
    formData.append('price', document.getElementById('edit-product-price').value);
    formData.append('category', document.getElementById('edit-product-category').value);
    const imageFile = document.getElementById('edit-product-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/products/${id}`, {
        method: 'PUT',
        body: formData
      });
      if (response.ok) {
        if (editProductModal) editProductModal.hide();
        loadProducts();
      } else {
        alert('Failed to update product');
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  });

  async function deleteProduct(id) {
    console.log('Deleting product ID:', id);
    // Removed confirm for better automation support, or user can re-add it.
    // if (!confirm('Are you sure?')) return; 
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/products/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        console.log('Product deleted successfully');
        loadProducts();
      } else {
        const data = await response.json();
        console.error('Failed to delete product:', data.error);
        alert('Failed to delete product: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  }

  // --- Blogs ---

  async function loadBlogs() {
    try {
      const response = await fetch(`${API_BASE_URL}/blogs`);
      const blogs = await response.json();
      if (!blogsList) return;
      blogsList.innerHTML = '';
      blogs.forEach(blog => {
        const div = document.createElement('div');
        div.className = 'list-group-item product-item';
        div.innerHTML = `
          <div class="product-info">
            ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="me-3" onerror="this.src='${assetUrl('images/snack_product.png')}'">` : '<div class="me-3" style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #6c757d; font-size: 24px;">📝</div>'}
            <div>
              <h6 class="mb-0">${blog.title}</h6>
              <p class="mb-0 text-muted" style="font-size: 0.85rem;">${blog.category} | By ${blog.author_name || 'Admin'}</p>
            </div>
          </div>
          <div class="product-actions">
            <button class="btn btn-sm btn-primary edit-blog-btn" data-id="${blog.id}">Edit</button>
            <button class="btn btn-sm btn-danger delete-blog-btn" data-id="${blog.id}">Delete</button>
          </div>
        `;
        blogsList.appendChild(div);
      });

      blogsList.onclick = (e) => {
        const deleteBtn = e.target.closest('.delete-blog-btn');
        const editBtn = e.target.closest('.edit-blog-btn');
        if (deleteBtn) deleteBlog(deleteBtn.dataset.id);
        if (editBtn) openEditBlogModal(editBtn.dataset.id);
      };
    } catch (error) {
      console.error('Error loading blogs:', error);
    }
  }

  if (addBlogForm) addBlogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', document.getElementById('blog-title').value);
    formData.append('category', document.getElementById('blog-category').value);
    formData.append('content', document.getElementById('blog-content').value);
    const imageFile = document.getElementById('blog-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/blogs`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        addBlogForm.reset();
        loadBlogs();
      } else {
        const data = await response.json();
        alert('Failed to add blog: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error adding blog:', error);
    }
  });

  async function openEditBlogModal(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/blogs`);
      const blogs = await response.json();
      const blog = blogs.find(b => b.id == id);
      if (blog && editBlogModal) {
        document.getElementById('edit-blog-id').value = blog.id;
        document.getElementById('edit-blog-title').value = blog.title;
        document.getElementById('edit-blog-category').value = blog.category;
        document.getElementById('edit-blog-content').value = blog.content;
        editBlogModal.show();
      }
    } catch (error) {
      console.error('Error opening blog modal:', error);
    }
  }

  if (saveEditBlogBtn) saveEditBlogBtn.addEventListener('click', async () => {
    const id = document.getElementById('edit-blog-id').value;
    const formData = new FormData();
    formData.append('title', document.getElementById('edit-blog-title').value);
    formData.append('category', document.getElementById('edit-blog-category').value);
    formData.append('content', document.getElementById('edit-blog-content').value);
    const imageFile = document.getElementById('edit-blog-image').files[0];
    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      console.log('Saving blog changes for ID:', id);
      const response = await authenticatedFetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'PUT',
        body: formData
      });
      console.log('Save response status:', response.status);
      if (response.ok) {
        console.log('Blog updated successfully');
        // Close modal using Bootstrap API or fallback to manual close
        if (editBlogModal && typeof editBlogModal.hide === 'function') {
          editBlogModal.hide();
        } else {
          // Fallback: manually hide the modal
          const modalEl = document.getElementById('editBlogModal');
          if (modalEl) {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            document.body.classList.remove('modal-open');
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) backdrop.remove();
          }
        }
        loadBlogs();
      } else {
        const data = await response.json();
        console.error('Save failed:', data);
        alert('Failed to update blog: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating blog:', error);
      alert('Error updating blog: ' + error.message);
    }
  });

  async function deleteBlog(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/blogs/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) loadBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
    }
  }

  // --- Users ---

  async function loadUsers() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users`);
      const users = await response.json();
      if (!usersList) return;
      usersList.innerHTML = '';
      if (users.length === 0) {
        usersList.innerHTML = '<p class="p-3 text-muted text-center">No regular users registered yet.</p>';
        return;
      }
      users.forEach(user => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
          <div>
            <h6 class="mb-0">${user.name}</h6>
            <small class="text-muted">${user.email} | ${user.phone || 'No phone'}</small>
          </div>
          <button class="btn btn-sm btn-danger delete-user-btn" data-id="${user.id}">Delete</button>
        `;
        usersList.appendChild(div);
      });

      usersList.onclick = (e) => {
        const deleteBtn = e.target.closest('.delete-user-btn');
        if (deleteBtn) deleteUser(deleteBtn.dataset.id);
      };
    } catch (error) {
      console.error('Error loading users:', error);
    }
  }

  async function deleteUser(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  // --- Admins ---

  async function loadAdmins() {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admins`);
      const admins = await response.json();
      if (!adminsList) return;
      adminsList.innerHTML = '';
      admins.forEach(admin => {
        const div = document.createElement('div');
        div.className = 'user-item';
        div.innerHTML = `
          <div>
            <h6 class="mb-0">${admin.name} ${admin.id === currentAdmin.id ? '(You)' : ''}</h6>
            <small class="text-muted">${admin.email}</small>
          </div>
          ${admin.id !== currentAdmin.id ? `<button class="btn btn-sm btn-danger delete-admin-btn" data-id="${admin.id}">Delete</button>` : ''}
        `;
        adminsList.appendChild(div);
      });

      adminsList.onclick = (e) => {
        const deleteBtn = e.target.closest('.delete-admin-btn');
        if (deleteBtn) deleteAdmin(deleteBtn.dataset.id);
      };
    } catch (error) {
      console.error('Error loading admins:', error);
    }
  }

  async function deleteAdmin(id) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/admins/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) loadAdmins();
    } catch (error) {
      console.error('Error deleting admin:', error);
    }
  }

  // Initial UI Setup
  updateUI();
});
