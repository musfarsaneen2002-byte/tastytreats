import { defineConfig } from 'vite'

export default defineConfig({
  base: '/tastytreats/',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        menu: 'menu.html',
        blog: 'blog.html',
        about: 'about.html',
        contact: 'contact.html',
        login: 'login.html',
        admin: 'admin.html'
      }
    }
  }
})
