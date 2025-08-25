window.addEventListener('DOMContentLoaded', () => {
  const API_URL = 'https://aziziyah-back-mysqlhost.up.railway.app/api/santri';

  const tbody = document.querySelector('#table-santri tbody');
  const filterKelas = document.getElementById('filterKelas');
  const filterKelompok = document.getElementById('filterKelompok');
  const searchInput = document.getElementById('searchSantri');
  const btnInputSantri = document.getElementById('btn-input-santri');
  const form = document.getElementById('form-santri');
  const editId = sessionStorage.getItem('editSantriId');
  let semuaDataSantri = [];

  // Format tanggal
  function toISODate(tanggal) {
    if (!tanggal) return '';
    const parts = tanggal.split('/');
    if (parts.length !== 3) return tanggal;
    const [month, day, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Tampilkan data santri
  function loadSantri() {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        semuaDataSantri = data;
        renderTabelSantri(data);
        isiDropdownFilter(data);
      })
      .catch(err => {
        console.error('Gagal memuat data:', err);
      });
  }

  // Tampilkan di tabel
  function renderTabelSantri(data) {
    tbody.innerHTML = '';
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="12">Tidak ada data</td></tr>`;
      return;
    }

    data.forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><a href="laporan-santri.html?id=${s.id}" class="nama-santri-link">${s.nama}</a></td>
        <td>${s.alias || '-'}</td>
        <td>${s.jk || '-'}</td>
        <td>${s.tgl_lahir || '-'}</td>
        <td>${s.wali || '-'}</td>
        <td>${s.alamat || '-'}</td>
        <td>${s.tgl_masuk || '-'}</td>
        <td>${s.kelas_utama || '-'}</td>
        <td>${s.kelas_extra || '-'}</td>
        <td>${s.kelompok || '-'}</td>
        <td>${s.status || '-'}</td>
        <td>
          <button class="btn-edit" data-id="${s.id}">✏️</button>
          <button class="btn-delete" data-id="${s.id}">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('editSantriId', btn.dataset.id);
        window.location.href = 'input-santri.html';
      });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus santri ini?')) {
          fetch(`${API_URL}/${btn.dataset.id}`, { method: 'DELETE' })
            .then(res => res.json())
            .then(() => {
              alert('Santri dihapus.');
              loadSantri();
            })
            .catch(err => console.error('Gagal menghapus:', err));
        }
      });
    });
  }

  // Isi dropdown filter
  function isiDropdownFilter(data) {
    const kelasSet = new Set();
    const kelompokSet = new Set();

    data.forEach(s => {
      if (s.kelas_utama) kelasSet.add(s.kelas_utama);
      if (s.kelas_extra) kelasSet.add(s.kelas_extra);
      if (s.kelompok) kelompokSet.add(s.kelompok);
    });

    filterKelas.innerHTML = `<option value="">Semua</option>`;
    filterKelompok.innerHTML = `<option value="">Semua</option>`;

    [...kelasSet].sort().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      filterKelas.appendChild(opt);
    });

    [...kelompokSet].sort().forEach(k => {
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = k;
      filterKelompok.appendChild(opt);
    });
  }

  // Filter pencarian
  function filterDataSantri() {
    const selectedKelas = filterKelas.value;
    const selectedKelompok = filterKelompok.value;
    const searchTerm = searchInput.value.toLowerCase();

    let hasil = semuaDataSantri.filter(s =>
      (selectedKelas === '' || s.kelas_utama === selectedKelas || s.kelas_extra === selectedKelas) &&
      (selectedKelompok === '' || s.kelompok === selectedKelompok)
    );

    if (searchTerm) {
      hasil = hasil.filter(s =>
        s.nama?.toLowerCase().includes(searchTerm) ||
        s.alias?.toLowerCase().includes(searchTerm)
      );
    }

    renderTabelSantri(hasil);
  }

  // Event filter
  filterKelas?.addEventListener('change', filterDataSantri);
  filterKelompok?.addEventListener('change', filterDataSantri);
  searchInput?.addEventListener('input', filterDataSantri);

  // Tombol tambah
  btnInputSantri?.addEventListener('click', () => {
    sessionStorage.removeItem('editSantriId');
    window.location.href = 'input-santri.html';
  });

  // Mode form (input-santri.html)
  if (form) {
    if (editId) {
      // Edit Mode
      fetch(`${API_URL}/${editId}`)
        .then(res => res.json())
        .then(s => {
          form.nama.value = s.nama;
          form.alias.value = s.alias || '';
          form.jk.value = s.jk || '';
          form.tgl_lahir.value = s.tgl_lahir || '';
          form.wali.value = s.wali || '';
          form.alamat.value = s.alamat || '';
          form.tgl_masuk.value = s.tgl_masuk || '';
          form.kelas_utama.value = s.kelas_utama || '';
          form.kelas_extra.value = s.kelas_extra || '';
          form.kelompok.value = s.kelompok || '';
        });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataBaru = ambilDataForm();
        fetch(`${API_URL}/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataBaru)
        })
          .then(res => res.json())
          .then(() => {
            alert('Data santri diperbarui.');
            sessionStorage.removeItem('editSantriId');
            window.location.href = 'data-santri.html';
          })
          .catch(err => console.error('Gagal update:', err));
      });

    } else {
      // Tambah Mode
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataBaru = ambilDataForm();
        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataBaru)
        })
          .then(res => res.json())
          .then(() => {
            alert('Santri ditambahkan.');
            window.location.href = 'data-santri.html';
          })
          .catch(err => console.error('Gagal simpan:', err));
      });
    }

    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editSantriId');
      window.location.href = 'data-santri.html';
    });

    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editSantriId');
      window.location.href = 'data-santri.html';
    });
  }

  function ambilDataForm() {
    return {
      nama: form.nama.value,
      alias: form.alias.value,
      jk: form.jk.value,
      tgl_lahir: form.tgl_lahir.value,
      wali: form.wali.value,
      alamat: form.alamat.value,
      tgl_masuk: form.tgl_masuk.value,
      kelas_utama: form.kelas_utama?.value || '',
      kelas_extra: form.kelas_extra?.value || '',
      kelompok: form.kelompok?.value || '',
      status: 'aktif'
    };
  }

  // Mulai load data awal
  if (tbody) loadSantri();
});
