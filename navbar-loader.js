function getBasePath() {
  const currentPath = window.location.pathname;
  const index = currentPath.indexOf('/pages');

  if (index === -1) return './';

  const afterPages = currentPath.slice(index + 1).split('/');
  const depth = afterPages.length - 1;

  return '../'.repeat(depth);
}

function loadNavbar() {
  const basePath = getBasePath();

  // 💡 Otomatis sesuaikan path ke navbar.html
  const navbarPath = basePath + 'component/navbar.html';

  fetch(navbarPath)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.text();
    })
    .then(html => {
      const navbarContainer = document.getElementById('navbar');
      if (!navbarContainer) throw new Error('Element #navbar tidak ditemukan');

      navbarContainer.innerHTML = html;

      // 🔗 Set semua href navbar
      const links = {
        'link-beranda': basePath + 'index.html',
        'link-data-santri': basePath + 'pages/santri/data-santri.html',
        'link-santri-nonaktif': basePath + 'pages/santri/santri-nonaktif.html',
        'link-data-guru': basePath + 'pages/guru/data-guru.html',
        'link-daftar-kelas': basePath + 'pages/kelas/daftar-kelas.html',
        'link-data-kelas': basePath + 'pages/kelas/data-kelas.html',
        'link-daftar-materi': basePath + 'pages/materi/daftar-materi.html',
        'link-absen-kelas': basePath + 'pages/kbm/absen-kelas.html',
        'link-jurnal-kelas': basePath + 'pages/kbm/jurnal-kelas.html',
        'link-rekap-absen': basePath + 'pages/laporan/rekap-absen.html',
        'link-rekap-jurnal': basePath + 'pages/laporan/rekap-jurnal.html',
        'link-kelompok': basePath + 'pages/kelompok/kelompok.html',
        'link-anggota' : basePath + 'pages/kelompok/anggota.html',
      };

      Object.entries(links).forEach(([id, href]) => {
        const el = document.getElementById(id);
        if (el) el.href = href;
      });

      // 🖼️ Atur logo dinamis
      const logoImg = navbarContainer.querySelector('.logo-img');
      if (logoImg) {
        logoImg.src = basePath + 'images/aziziyah.png';
      }
    })
    .catch(err => {
      console.error('Gagal memuat navbar:', err);
    });
}
