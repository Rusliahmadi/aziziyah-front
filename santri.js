window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#table-santri tbody');
  const filterKelas = document.getElementById('filterKelas');
  const filterKelompok = document.getElementById('filterKelompok');
  const searchInput = document.getElementById('searchSantri');
  const btnInputSantri = document.getElementById('btn-input-santri');
  const form = document.getElementById('form-santri');
  const editId = sessionStorage.getItem('editSantriId');
  let semuaDataSantri = [];

  // Fungsi konversi tanggal MM/DD/YYYY -> YYYY-MM-DD
  function toISODate(tanggal) {
    if (!tanggal) return '';
    const parts = tanggal.split('/');
    if (parts.length !== 3) return tanggal;
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

  // Ambil data jika ada tabel
  if (tbody) {
    window.electronAPI.mintaDataSantri();
    window.electronAPI.terimaDataSantri((dataSantri) => {
      semuaDataSantri = dataSantri.filter(s => s.status === 'aktif');
      renderTabelSantri(semuaDataSantri);
      if (filterKelas && filterKelompok) isiDropdownFilter(semuaDataSantri);
    });
  }

  // Render Tabel
  function renderTabelSantri(data) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="12">Tidak ada data</td>`;
      tbody.appendChild(tr);
      return;
    }

    data.forEach((santri) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
        <a href="laporan-santri.html?id=${santri.id}" 
           style="color: inherit; text-decoration: none; cursor: pointer;"
           class="nama-santri-link">${santri.nama}</a></td>
        <td>${santri.alias || '-'}</td>
        <td>${santri.jk || '-'}</td>
        <td>${santri.tgl_lahir}</td>
        <td>${santri.wali}</td>
        <td>${santri.alamat}</td>
        <td>${santri.tgl_masuk}</td>
        <td>${santri.kelas_utama || '-'}</td>
        <td>${santri.kelas_extra || '-'}</td>
        <td>${santri.kelompok || '-'}</td>
        <td>${santri.status || '-'}</td>
        <td>
          <button class="btn-edit" data-id="${santri.id}">✏️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        sessionStorage.setItem('editSantriId', id);
        window.location.href = 'input-santri.html';
      });
    });
  }

  // Dropdown filter kelas & kelompok
  function isiDropdownFilter(data) {
    const kelasSet = new Set();
    const kelompokSet = new Set();

    data.forEach(s => {
      if (s.kelas_utama) kelasSet.add(s.kelas_utama);
      if (s.kelas_extra) kelasSet.add(s.kelas_extra);
      if (s.kelompok) kelompokSet.add(s.kelompok);
    });

    [...kelasSet].sort().forEach(kelas => {
      const option = document.createElement('option');
      option.value = kelas;
      option.textContent = kelas;
      filterKelas.appendChild(option);
    });

    [...kelompokSet].sort().forEach(kelompok => {
      const option = document.createElement('option');
      option.value = kelompok;
      option.textContent = kelompok;
      filterKelompok.appendChild(option);
    });
  }

  // Filter Data berdasarkan dropdown & pencarian
  function filterDataSantri() {
    if (!filterKelas || !filterKelompok || !searchInput) return;

    const selectedKelas = filterKelas.value;
    const selectedKelompok = filterKelompok.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    // Filter berdasarkan kelas dan kelompok
    let hasil = semuaDataSantri.filter(s =>
      (selectedKelas === '' || s.kelas_utama === selectedKelas || s.kelas_extra === selectedKelas) &&
      (selectedKelompok === '' || s.kelompok === selectedKelompok)
    );

    // Filter berdasarkan pencarian nama & alias
    if (searchTerm) {
      hasil = hasil.filter(santri =>
        (santri.nama && santri.nama.toLowerCase().includes(searchTerm)) ||
        (santri.alias && santri.alias.toLowerCase().includes(searchTerm))
      );
    }

    renderTabelSantri(hasil);
  }

  if (filterKelas) filterKelas.addEventListener('change', filterDataSantri);
  if (filterKelompok) filterKelompok.addEventListener('change', filterDataSantri);
  if (searchInput) searchInput.addEventListener('input', filterDataSantri);

  if (btnInputSantri) {
    btnInputSantri.addEventListener('click', () => {
      sessionStorage.removeItem('editSantriId');
      window.location.href = 'input-santri.html';
    });
  }

  // FORM INPUT/EDIT SANTRI
  if (form) {
    if (editId) {
      // MODE EDIT
      window.electronAPI.mintaDataSantri();
      window.electronAPI.terimaDataSantri((dataSantri) => {
        const santri = dataSantri.find(s => s.id === parseInt(editId));
        if (santri) {
          form.nama.value = santri.nama;
          form.alias.value = santri.alias || '';
          form.jk.value = santri.jk || '';
          form.tgl_lahir.value = toISODate(santri.tgl_lahir);
          form.wali.value = santri.wali;
          form.alamat.value = santri.alamat;
          form.tgl_masuk.value = toISODate(santri.tgl_masuk);
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataSantri = {
          nama: form.nama.value,
          alias: form.alias.value,
          jk: form.jk.value,
          tgl_lahir: form.tgl_lahir.value,
          wali: form.wali.value,
          alamat: form.alamat.value,
          tgl_masuk: form.tgl_masuk.value,
        };
        window.electronAPI.updateDataPokokSantri(parseInt(editId), dataSantri);
        alert('Data santri berhasil diperbarui!');
        sessionStorage.removeItem('editSantriId');
        window.location.href = 'data-santri.html';
      });

    } else {
      // MODE TAMBAH BARU
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataSantri = {
          nama: form.nama.value,
          alias: form.alias.value,
          jk: form.jk.value,
          tgl_lahir: form.tgl_lahir.value,
          wali: form.wali.value,
          alamat: form.alamat.value,
          tgl_masuk: form.tgl_masuk.value,
        };
        window.electronAPI.kirimDataSantri(dataSantri);
        alert('Data berhasil disimpan!');
        form.reset();
      });
    }

    // Tombol batal dan kembali
    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editSantriId');
      form.reset();
      window.location.href = 'data-santri.html';
    });

    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editSantriId');
      window.location.href = 'data-santri.html';
    });
  }
});
