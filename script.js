// script.js

// Fungsi untuk memuat navbar
function loadNavbar() {
  return fetch('navbar.html')
    .then(response => response.text())
    .then(data => {
      document.getElementById('navbar-container').innerHTML = data;
    })
    .catch(error => {
      console.error('Gagal memuat navbar:', error);
    });
}

// Fungsi untuk memuat data dari backend
function loadDataFromAPI() {
  fetch('https://github.com/Rusliahmadi/aziziyah-back.git') // ganti dengan URL backend kamu
    .then(response => response.json())
    .then(data => {
      const list = document.getElementById('data-list');
      data.forEach(item => {
        const li = document.createElement('li');
        li.textContent = JSON.stringify(item);
        list.appendChild(li);
      });
    })
    .catch(error => {
      console.error('Error saat mengambil data:', error);
    });
}

// Jalankan saat halaman sudah dimuat
window.addEventListener('DOMContentLoaded', () => {
  loadNavbar().then(() => {
    loadDataFromAPI(); // dijalankan setelah navbar berhasil dimuat
  });
});


