window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#table-santri tbody');
  const filterKelas = document.getElementById('filterKelas');
  const filterKelompok = document.getElementById('filterKelompok');
  const searchInput = document.getElementById('searchSantri');
  const btnInputSantri = document.getElementById('btn-input-santri');
  const form = document.getElementById('form-santri');
  const editId = sessionStorage.getItem('editSantriId');
  let semuaDataSantri = [];

  function toISODate(tanggal) {
    if (!tanggal) return '';
    const parts = tanggal.split('/');
    if (parts.length !== 3) return tanggal;
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }

                          // Ambil dan tampilkan data santri (READ)
  if (tbody) {
    fetch('https://aziziyah-back-mysqlhost.up.railway.app/api/santri')
      .then(response => response.json())
      .then(dataSantri => {
        // Gabungkan dengan localStorage jika ada perubahan di browser
        const localData = JSON.parse(localStorage.getItem('santriBaru')) || [];
        const combined = [...dataSantri, ...localData];

        semuaDataSantri = combined.filter(s => s.status === 'aktif');
        renderTabelSantri(semuaDataSantri);
        if (filterKelas && filterKelompok) isiDropdownFilter(semuaDataSantri);
      })
      .catch(error => {
        console.error('Gagal memuat data santri:', error);
      });
  }

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
             style="color: inherit; text-decoration: none;" 
             class="nama-santri-link">${santri.nama}</a>
        </td>
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
        <td><button class="btn-edit" data-id="${santri.id}">✏️</button></td>
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

  function filterDataSantri() {
    if (!filterKelas || !filterKelompok || !searchInput) return;

    const selectedKelas = filterKelas.value;
    const selectedKelompok = filterKelompok.value;
    const searchTerm = searchInput.value.toLowerCase().trim();

    let hasil = semuaDataSantri.filter(s =>
      (selectedKelas === '' || s.kelas_utama === selectedKelas || s.kelas_extra === selectedKelas) &&
      (selectedKelompok === '' || s.kelompok === selectedKelompok)
    );

    if (searchTerm) {
      hasil = hasil.filter(s =>
        (s.nama && s.nama.toLowerCase().includes(searchTerm)) ||
        (s.alias && s.alias.toLowerCase().includes(searchTerm))
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
  if (form) {
    if (editId) {
      // Mode EDIT
      fetch('data/santri.json')
        .then(response => response.json())
        .then(dataSantri => {
          const localData = JSON.parse(localStorage.getItem('santriBaru')) || [];
          const semua = [...dataSantri, ...localData];
          const santri = semua.find(s => s.id === parseInt(editId));
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
        const dataBaru = {
          id: parseInt(editId),
          nama: form.nama.value,
          alias: form.alias.value,
          jk: form.jk.value,
          tgl_lahir: form.tgl_lahir.value,
          wali: form.wali.value,
          alamat: form.alamat.value,
          tgl_masuk: form.tgl_masuk.value,
          status: 'aktif'
        };

        const dataSebelumnya = JSON.parse(localStorage.getItem('santriBaru')) || [];
        const baru = dataSebelumnya.map(s => s.id === dataBaru.id ? dataBaru : s);
        localStorage.setItem('santriBaru', JSON.stringify(baru));

        alert('Data santri berhasil diperbarui!');
        sessionStorage.removeItem('editSantriId');
        window.location.href = 'data-santri.html';
      });

    } else {
      // Mode TAMBAH
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const semua = JSON.parse(localStorage.getItem('santriBaru')) || [];
        const idBaru = Date.now(); // ID unik sementara
        const dataBaru = {
          id: idBaru,
          nama: form.nama.value,
          alias: form.alias.value,
          jk: form.jk.value,
          tgl_lahir: form.tgl_lahir.value,
          wali: form.wali.value,
          alamat: form.alamat.value,
          tgl_masuk: form.tgl_masuk.value,
          status: 'aktif'
        };

        semua.push(dataBaru);
        localStorage.setItem('santriBaru', JSON.stringify(semua));
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


