import './style.css'

const baseUrl = import.meta.env.BASE_URL;
const pageUrl = (page) => `${baseUrl}${page}`;
const assetUrl = (path) => `${baseUrl}${path}`;
const hasBackend = !window.location.hostname.endsWith('github.io');

const fallbackProducts = [
  {
    id: 1,
    name: 'Masala Chai',
    description: 'Freshly brewed spiced tea with milk and aromatic Indian spices.',
    price: 20,
    category: 'tea',
    image: assetUrl('images/masala_chai.jpg')
  },
  {
    id: 2,
    name: 'Samosa',
    description: 'Crispy pastry filled with a warm, savory potato masala.',
    price: 15,
    category: 'snack',
    image: assetUrl('images/samosa.jpg')
  },
  {
    id: 3,
    name: 'Fresh Juice',
    description: 'Refreshing fruit juice made fresh for a bright tea-time pairing.',
    price: 40,
    category: 'juice',
    image: assetUrl('images/juice_product.png')
  }
];

const fallbackBlogs = [
  {
    id: 1,
    title: 'How to Make Authentic Masala Chai at Home',
    category: 'Tea',
    content: 'A perfect masala chai starts with patient brewing, fresh spices, and tea leaves that can hold their flavor with milk. Try ginger, cardamom, cinnamon, and cloves for a rich cup.',
    image: assetUrl('images/masala_chai.jpg'),
    created_at: '2026-05-01',
    author_name: 'Tasty Treats'
  },
  {
    id: 2,
    title: 'Tea-Time Snacks We Love',
    category: 'Snacks',
    content: 'Crispy samosas, pakoras, and parippu vada bring warmth and crunch to a good tea break. The best pairings balance spice, texture, and freshness.',
    image: assetUrl('images/samosa.jpg'),
    created_at: '2026-05-02',
    author_name: 'Tasty Treats'
  }
];

async function fetchJson(path, fallback) {
  if (!hasBackend) {
    return fallback;
  }

  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn(`Using static fallback for ${path}`, error);
    return fallback;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // --- Menu Logic ---
  const menuGrid = document.getElementById('menu-grid');
  const filterButtons = document.querySelectorAll('.filter-btn');
  let allProducts = [];
  
  function renderMenu(products) {
    if (!menuGrid) return;
    menuGrid.innerHTML = '';
    if (products.length === 0) {
      menuGrid.innerHTML = '<p style="text-align: center; width: 100%;">No products added yet.</p>';
      return;
    }

    products.forEach((product, index) => {
      const delayClass = index % 3 === 0 ? '' : (index % 3 === 1 ? 'delay-1' : 'delay-2');
      const card = document.createElement('div');
      card.className = `menu-card ${delayClass}`;
      card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="menu-img" onerror="this.src='${assetUrl('images/snack_product.png')}'" onload="this.classList.add('loaded')" />
        <h3>${product.name}</h3>
        <p class="description">${product.description || ''}</p>
        <p class="price">₹${product.price.toFixed(2)}</p>
      `;
      menuGrid.appendChild(card);
      observer.observe(card);
    });
  }

  if (menuGrid) {
    fetchJson('/api/products', fallbackProducts)
      .then(products => {
        allProducts = products;
        renderMenu(allProducts);

        filterButtons.forEach(button => {
          button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach(btn => btn.classList.toggle('active', btn === button));
            const filtered = filter === 'all'
              ? allProducts
              : allProducts.filter(product => product.category === filter);
            renderMenu(filtered);
          });
        });
      })
      .catch(err => console.error('Error loading products:', err));
  }

  // --- Latest Blog Logic ---
  const latestBlogContainer = document.getElementById('latest-blog-container');
  if (latestBlogContainer) {
    fetchJson('/api/blogs?limit=1', fallbackBlogs.slice(0, 1))
      .then(blogs => {
        if (blogs && blogs.length > 0) {
          const blog = blogs[0];
          const blogCard = document.createElement('div');
          blogCard.className = 'latest-blog-card';
          blogCard.innerHTML = `
            <div class="latest-blog-content">
              ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="latest-blog-image">` : ''}
              <div class="latest-blog-text">
                <div class="blog-meta">${blog.category || 'Lifestyle'} • ${new Date(blog.created_at).toLocaleDateString()}</div>
                <h3 class="latest-blog-title">${blog.title}</h3>
                <p class="latest-blog-excerpt">${blog.content.substring(0, 200)}...</p>
                <a href="${pageUrl('blog.html')}" class="latest-blog-link">Read More on Our Blog →</a>
              </div>
            </div>
          `;
          latestBlogContainer.appendChild(blogCard);
          observer.observe(blogCard);
        } else {
          latestBlogContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No blog posts yet. Check back soon!</p>';
        }
      })
      .catch(err => {
        console.error('Error loading latest blog:', err);
        latestBlogContainer.innerHTML = '<p style="text-align: center; color: red;">Failed to load latest blog.</p>';
      });
  }

  // --- Blog Logic ---
  const blogGrid = document.getElementById('blog-grid');
  if (blogGrid) {
    fetchJson('/api/blogs', fallbackBlogs)
      .then(blogs => {
        blogGrid.innerHTML = '';
        if (blogs.length === 0) {
          blogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary);">No blog posts yet. Stay tuned!</p>';
          return;
        }

        blogs.forEach((blog, index) => {
          const delayClass = index % 3 === 1 ? 'delay-1' : (index % 3 === 2 ? 'delay-2' : '');
          const card = document.createElement('div');
          card.className = `blog-card animate-in ${delayClass}`;
          card.innerHTML = `
            ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-image" onerror="this.style.display='none'">` : ''}
            <div class="blog-content">
              <div class="blog-meta">${blog.category || 'Lifestyle'} • ${new Date(blog.created_at).toLocaleDateString()}</div>
              <h2 class="blog-title">${blog.title}</h2>
              <p class="blog-excerpt">${blog.content.substring(0, 150)}...</p>
              <div class="blog-footer">
                <span>By ${blog.author_name || 'Admin'}</span>
                <button class="read-more-btn" data-blog-id="${blog.id}" style="color: var(--accent-matcha); background: none; border: none; text-decoration: none; font-weight: 600; cursor: pointer;">Read More →</button>
              </div>
            </div>
          `;
          blogGrid.appendChild(card);
        });
      })
      .catch(err => {
        console.error('Error loading blogs:', err);
        blogGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: red;">Failed to load blogs.</p>';
      });

      // Add event listeners for Read More buttons
      document.addEventListener('click', (e) => {
        if (e.target.classList.contains('read-more-btn')) {
          const blogId = e.target.dataset.blogId;
          showBlogModal(blogId);
        }
      });
  }


  // --- Blog Modal ---
  function showBlogModal(blogId) {
    fetchJson('/api/blogs', fallbackBlogs)
      .then(blogs => {
        const blog = blogs.find(b => b.id == blogId);
        if (blog) {
          const modal = document.createElement('div');
          modal.className = 'blog-modal-overlay';
          modal.innerHTML = `
            <div class="blog-modal">
              <div class="blog-modal-header">
                <h2>${blog.title}</h2>
                <button class="blog-modal-close">&times;</button>
              </div>
              <div class="blog-modal-content">
                ${blog.image ? `<img src="${blog.image}" alt="${blog.title}" class="blog-modal-image" onerror="this.style.display='none'">` : ''}
                <div class="blog-modal-meta">${blog.category || 'Lifestyle'} • ${new Date(blog.created_at).toLocaleDateString()} • By ${blog.author_name || 'Admin'}</div>
                <div class="blog-modal-text">${blog.content.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          // Close modal functionality
          modal.querySelector('.blog-modal-close').onclick = () => modal.remove();
          modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
          };
        }
      })
      .catch(err => console.error('Error loading blog details:', err));
  }


  // --- User Auth (Traditional) ---
  const loginForm = document.getElementById('user-login-form');
  const signupForm = document.getElementById('user-signup-form');
  const showSignupLink = document.getElementById('show-signup');
  const showLoginLink = document.getElementById('show-login');
  const loginContainer = document.getElementById('login-form-container');
  const signupContainer = document.getElementById('signup-form-container');

  if (showSignupLink && showLoginLink) {
    showSignupLink.onclick = (e) => {
      e.preventDefault();
      loginContainer.style.display = 'none';
      signupContainer.style.display = 'block';
    };
    showLoginLink.onclick = (e) => {
      e.preventDefault();
      signupContainer.style.display = 'none';
      loginContainer.style.display = 'block';
    };
  }

  if (loginForm) {
    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      const errorDiv = document.getElementById('login-error');
      errorDiv.style.display = 'none';

      try {
        const loginPayload = JSON.stringify({ email, password });
        const response = await fetch('/api/user/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: loginPayload
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminData');
          localStorage.setItem('userData', JSON.stringify(data.user));
          localStorage.setItem('userToken', data.token);
          window.location.href = pageUrl('index.html');
        } else {
          const adminResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: loginPayload
          });
          const adminData = await adminResponse.json();

          if (adminResponse.ok) {
            localStorage.removeItem('userData');
            localStorage.removeItem('userToken');
            localStorage.setItem('adminToken', adminData.token);
            localStorage.setItem('adminData', JSON.stringify(adminData.admin));
            window.location.href = pageUrl('admin.html');
          } else {
            errorDiv.textContent = adminData.error || data.error || 'Login failed';
            errorDiv.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Login error details:', err);
        errorDiv.textContent = 'Connection error: ' + err.message;
        errorDiv.style.display = 'block';
      }
    };
  }

  if (signupForm) {
    signupForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      const errorDiv = document.getElementById('signup-error');
      const successDiv = document.getElementById('signup-success');
      
      errorDiv.style.display = 'none';
      successDiv.style.display = 'none';

      try {
        const response = await fetch('/api/user/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          successDiv.textContent = 'Registration successful! Please login.';
          successDiv.style.display = 'block';
          signupForm.reset();
          setTimeout(() => showLoginLink.click(), 2000);
        } else {
          errorDiv.textContent = data.error || 'Registration failed';
          errorDiv.style.display = 'block';
        }
      } catch (err) {
        console.error('Signup error details:', err);
        errorDiv.textContent = 'Connection error: ' + err.message;
        errorDiv.style.display = 'block';
      }
    };
  }

  // Tea drop cursor animation
  let lastDropTime = 0;
  document.addEventListener('mousemove', (e) => {
    const now = Date.now();
    if (now - lastDropTime > 50) {
      createTeaDrop(e.clientX, e.clientY);
      lastDropTime = now;
    }
  });

  function createTeaDrop(x, y) {
    const drop = document.createElement('div');
    drop.classList.add('tea-drop');
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    drop.style.left = `${x + offsetX}px`;
    drop.style.top = `${y + offsetY}px`;
    const size = 6 + Math.random() * 6;
    drop.style.width = `${size}px`;
    drop.style.height = `${size}px`;
    document.body.appendChild(drop);
    setTimeout(() => { drop.remove(); }, 1000);
  }
});
