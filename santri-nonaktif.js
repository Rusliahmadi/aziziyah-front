window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#table-santri tbody');
  const btnKembali = document.getElementById('btn-kembali');

  // 1. Minta data santri dari backend (via Electron IPC)
  window.electronAPI.mintaDataSantri();

  // 2. Tangani data yang diterima
  window.electronAPI.terimaDataSantri((dataSantri) => {
    const nonaktif = dataSantri.filter(s => s.status?.toLowerCase() === 'nonaktif');
    renderTabel(nonaktif);
  });

  // 3. Fungsi untuk menampilkan tabel santri nonaktif
  function renderTabel(data) {
    tbody.innerHTML = '';

    if (data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="11">Tidak ada santri nonaktif.</td>`;
      tbody.appendChild(tr);
      return;
    }

    data.forEach(santri => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <a href="laporan-santri.html?id=${santri.id}" 
             class="nama-santri-link" 
             style="color: inherit; text-decoration: none; cursor: pointer;">
             ${santri.nama}
          </a>
        </td>
        <td>${santri.alias || '-'}</td>
        <td>${santri.jk || '-'}</td>
        <td>${santri.tgl_lahir || '-'}</td>
        <td>${santri.wali || '-'}</td>
        <td>${santri.alamat || '-'}</td>
        <td>${santri.tgl_masuk || '-'}</td>
        <td>${santri.kelas_utama || '-'}</td>
        <td>${santri.kelas_extra || '-'}</td>
        <td>${santri.kelompok || '-'}</td>
        <td>${santri.status || '-'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // 4. (Opsional) Tombol kembali
  if (btnKembali) {
    btnKembali.addEventListener('click', () => {
      window.history.back();
    });
  }
});
