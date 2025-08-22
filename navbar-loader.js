// navbar-loader.js
document.addEventListener('DOMContentLoaded', () => {
  fetch('navbar.html')
    .then(response => response.text())
    .then(html => {
      document.getElementById('navbar-container').innerHTML = html;
    })
    .catch(err => {
      console.error('Gagal memuat navbar:', err);
    });
});
