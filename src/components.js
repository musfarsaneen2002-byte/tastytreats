import { shopContactInfo } from './contact-info.js';

/**
 * Common Navigation and Footer Components
 * This script injects the shared navbar and footer into all pages.
 */

const NavbarHTML = `
  <nav class="navbar">
    <a href="/index.html" class="nav-brand">
      <img src="/images/tasty-treats-logo.jpg" alt="Tasty Treats logo" class="brand-logo" />
      <span>Tasty Treats</span>
    </a>
    <button class="menu-toggle" id="mobile-menu-btn" aria-label="Open navigation menu">&#9776;</button>
    <ul class="nav-links" id="nav-links">
      <li><a href="/index.html">Home</a></li>
      <li><a href="/menu.html">Menu</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/about.html">About</a></li>
      <li><a href="/contact.html">Contact</a></li>
      <li class="user-dropdown">
        <button class="user-icon-btn" id="user-menu-btn" aria-label="Open user menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
        </button>
        <div class="dropdown-menu" id="user-dropdown-menu">
          <div id="unauthenticated-links">
            <a href="/login.html" class="dropdown-item">Login / Sign Up</a>
          </div>
          <div id="authenticated-links" style="display: none;">
            <div class="dropdown-item" style="border-bottom: 1px solid var(--glass-border); margin-bottom: 5px;">
              <span id="display-user-name" style="font-weight: 600;"></span>
            </div>
            <a href="/admin.html" class="dropdown-item">Admin Panel</a>
            <a href="#" id="logout-action" class="dropdown-item" style="color: #ff4d4d;">Logout</a>
          </div>
        </div>
      </li>
    </ul>
  </nav>
`;

const FooterHTML = `
  <footer class="footer">
    <div class="footer-content">
      <div class="footer-section">
        <h3 class="footer-brand">
          <img src="/images/tasty-treats-logo.jpg" alt="Tasty Treats logo" class="footer-logo" />
          <span>Tasty Treats</span>
        </h3>
        <p>Your sanctuary in the city for premium organic teas and artisanal snacks.</p>
        <div class="social-links" aria-label="Social media links">
          <a href="https://www.instagram.com/_tasty.treats._/" class="social-link" target="_blank" rel="noopener noreferrer" aria-label="Tasty Treats on Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="16" height="16" x="4" y="4" stroke="currentColor" stroke-width="2" rx="5"/>
              <circle cx="12" cy="12" r="3.5" stroke="currentColor" stroke-width="2"/>
              <circle cx="17" cy="7" r="1.2" fill="currentColor"/>
            </svg>
            <span>Instagram</span>
          </a>
        </div>
      </div>
      <div class="footer-section">
        <h3>Quick Links</h3>
        <ul class="footer-links">
          <li><a href="/index.html">Home</a></li>
          <li><a href="/menu.html">Menu</a></li>
          <li><a href="/blog.html">Blog</a></li>
          <li><a href="/about.html">About Us</a></li>
          <li><a href="/contact.html">Contact</a></li>
        </ul>
      </div>
      <div class="footer-section">
        <h3>Contact Us</h3>
        <ul class="footer-links">
          <li><a href="${shopContactInfo.phoneHref}">ph: ${shopContactInfo.phoneDisplay}</a></li>
          <li><a href="mailto:${shopContactInfo.email}">Email: ${shopContactInfo.email}</a></li>
          <li><a href="/contact.html">Location: ${shopContactInfo.location}</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 Tasty Treats Tea Shop. All rights reserved.</p>
    </div>
  </footer>
`;

function initializeNavbarLogic() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  const userMenuBtn = document.getElementById('user-menu-btn');
  const userDropdownMenu = document.getElementById('user-dropdown-menu');

  if (userMenuBtn && userDropdownMenu) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdownMenu.classList.toggle('active');
    });

    document.addEventListener('click', () => {
      userDropdownMenu.classList.remove('active');
    });
  }

  const logoutAction = document.getElementById('logout-action');
  if (logoutAction) {
    logoutAction.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('userData');
      localStorage.removeItem('userToken');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      updateUserUI();
      window.location.reload();
    });
  }

  updateUserUI();
}

function updateUserUI() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  const adminToken = localStorage.getItem('adminToken');
  const adminData = JSON.parse(localStorage.getItem('adminData'));
  const unauthLinks = document.getElementById('unauthenticated-links');
  const authLinks = document.getElementById('authenticated-links');
  const userNameSpan = document.getElementById('display-user-name');
  const adminPanelLink = document.querySelector('a[href="/admin.html"]');

  // Check if user is logged in (either as regular user or admin)
  if ((userData || adminToken) && unauthLinks && authLinks) {
    // Set user name
    if (userNameSpan) {
      userNameSpan.textContent = userData?.name || adminData?.name || 'User';
    }
    unauthLinks.style.display = 'none';
    authLinks.style.display = 'block';
    
    // Only show admin panel link if user is an admin
    if (adminPanelLink) {
      if (adminToken) {
        adminPanelLink.style.display = 'block';
      } else {
        adminPanelLink.style.display = 'none';
      }
    }
  } else if (unauthLinks && authLinks) {
    unauthLinks.style.display = 'block';
    authLinks.style.display = 'none';
    if (adminPanelLink) {
      adminPanelLink.style.display = 'none';
    }
  }
}

window.handleCredentialResponse = (response) => {
  const responsePayload = decodeJwtResponse(response.credential);

  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminData');
  localStorage.setItem('userData', JSON.stringify({
    name: responsePayload.name,
    email: responsePayload.email,
    picture: responsePayload.picture
  }));

  updateUserUI();

  if (window.location.pathname.includes('login.html')) {
    window.location.href = '/index.html';
  } else {
    window.location.reload();
  }
};

function decodeJwtResponse(token) {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));

  return JSON.parse(jsonPayload);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectComponents);
} else {
  injectComponents();
}

function injectComponents() {
  const navPlaceholder = document.getElementById('navbar-placeholder');
  const footerPlaceholder = document.getElementById('footer-placeholder');

  if (navPlaceholder) {
    navPlaceholder.innerHTML = NavbarHTML;
    initializeNavbarLogic();
  }

  if (footerPlaceholder) {
    footerPlaceholder.innerHTML = FooterHTML;
  }
}
