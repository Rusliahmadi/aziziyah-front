window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#tabel-santri tbody');
  const filterKelas = document.getElementById('filterKelas');
  const searchInput = document.getElementById('searchInput'); // input pencarian

  let kelasList = [];
  let kelompokList = [];
  let allSantri = [];

  // Ambil data kelas
  window.electronAPI.mintaDataKelas();
  window.electronAPI.terimaDataKelas((data) => {
    kelasList = data;

    if (filterKelas) {
      filterKelas.innerHTML = `
        <option value="">-- Semua Kelas --</option>
        <option value="belum">Belum Memiliki Kelas</option>
      `;
      kelasList.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        filterKelas.appendChild(opt);
      });

      filterKelas.addEventListener('change', renderSantri);
    }

    tryLoadSantri();
  });

  // Ambil data kelompok
  window.electronAPI.mintaDataKelompok();
  window.electronAPI.terimaDataKelompok((data) => {
    kelompokList = data;
    tryLoadSantri();
  });

  // Ambil data santri
  function tryLoadSantri() {
    if (kelasList.length === 0 || kelompokList.length === 0) return;

    window.electronAPI.mintaDataSantri();
    window.electronAPI.terimaDataSantri((dataSantri) => {
      allSantri = dataSantri;
      renderSantri();
    });
  }

  // Fitur pencarian
  if (searchInput) {
    searchInput.addEventListener('input', renderSantri);
  }

  function renderSantri() {
    tbody.innerHTML = '';

    const selectedFilter = filterKelas ? filterKelas.value : '';
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Filter santri berdasarkan kelas
    let santriFiltered = allSantri.filter(s => {
      // Filter kelas
      const matchKelas =
        selectedFilter === '' ||
        (selectedFilter === 'belum' &&
          (!s.kelas_utama || s.kelas_utama === '-' || s.kelas_utama === null || s.kelas_utama === '')) ||
        s.kelas_utama === selectedFilter || s.kelas_extra === selectedFilter;

      // Filter pencarian nama/alias
      const matchSearch =
        s.nama.toLowerCase().includes(keyword) ||
        (s.alias && s.alias.toLowerCase().includes(keyword));

      return matchKelas && matchSearch;
    });

    // Urutkan agar yang belum punya kelas utama muncul di atas
    santriFiltered.sort((a, b) => {
      const aKosong = !a.kelas_utama || a.kelas_utama === '-' || a.kelas_utama === '';
      const bKosong = !b.kelas_utama || b.kelas_utama === '-' || b.kelas_utama === '';
      return aKosong === bKosong ? 0 : aKosong ? -1 : 1;
    });

    santriFiltered.forEach(santri => {
      const tr = document.createElement('tr');

      // Nama
      const tdNama = document.createElement('td');
      tdNama.textContent = santri.nama;
      tr.appendChild(tdNama);

      // Alias
      const tdAlias = document.createElement('td');
      tdAlias.textContent = santri.alias || '-';
      tr.appendChild(tdAlias);

      // Kelas Utama
      const tdKelasUtama = document.createElement('td');
      const selectKelasUtama = document.createElement('select');
      const kosongUtama = document.createElement('option');
      kosongUtama.value = '';
      kosongUtama.textContent = '-- pilih kelas --';
      selectKelasUtama.appendChild(kosongUtama);
      kelasList.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        if (k.nama === santri.kelas_utama) opt.selected = true;
        selectKelasUtama.appendChild(opt);
      });
      tdKelasUtama.appendChild(selectKelasUtama);
      tr.appendChild(tdKelasUtama);

      // Kelas Ekstra
      const tdKelasExtra = document.createElement('td');
      const selectKelasExtra = document.createElement('select');
      const kosongExtra = document.createElement('option');
      kosongExtra.value = '';
      kosongExtra.textContent = '-- tidak ada --';
      selectKelasExtra.appendChild(kosongExtra);
      kelasList.forEach(k => {
        const opt = document.createElement('option');
        opt.value = k.nama;
        opt.textContent = k.nama;
        if (k.nama === santri.kelas_extra) opt.selected = true;
        selectKelasExtra.appendChild(opt);
      });
      tdKelasExtra.appendChild(selectKelasExtra);
      tr.appendChild(tdKelasExtra);

      // Kelompok
      const tdKelompok = document.createElement('td');
      const selectKelompok = document.createElement('select');
      const kosongKelompok = document.createElement('option');
      kosongKelompok.value = '';
      kosongKelompok.textContent = '-- tidak ada --';
      selectKelompok.appendChild(kosongKelompok);
      kelompokList.forEach(kel => {
        const opt = document.createElement('option');
        opt.value = kel.nama;
        opt.textContent = kel.nama;
        if (kel.nama === santri.kelompok) opt.selected = true;
        selectKelompok.appendChild(opt);
      });
      tdKelompok.appendChild(selectKelompok);
      tr.appendChild(tdKelompok);

      // Status
      const tdStatus = document.createElement('td');
      const selectStatus = document.createElement('select');
      ['aktif', 'nonaktif', 'lulus', 'pindah'].forEach(s => {
        const opt = document.createElement('option');
        opt.value = s;
        opt.textContent = s;
        if (s === santri.status) opt.selected = true;
        selectStatus.appendChild(opt);
      });
      tdStatus.appendChild(selectStatus);
      tr.appendChild(tdStatus);

      // Tombol Simpan
      const tdAksi = document.createElement('td');
      const btnSimpan = document.createElement('button');
      btnSimpan.textContent = '💾';
      btnSimpan.title = 'Simpan Perubahan';
      btnSimpan.addEventListener('click', () => {
        const updated = {
          kelas_utama: selectKelasUtama.value,
          kelas_extra: selectKelasExtra.value,
          kelompok: selectKelompok.value,
          status: selectStatus.value
        };
        window.electronAPI.updateKelasSantri(santri.id, updated);
        alert('Data berhasil diperbarui.');
      });
      tdAksi.appendChild(btnSimpan);
      tr.appendChild(tdAksi);

      tbody.appendChild(tr);
    });
  }
});
