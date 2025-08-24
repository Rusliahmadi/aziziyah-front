window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#tabel-santri tbody');
  const filterKelas = document.getElementById('filterKelas');
  const searchInput = document.getElementById('searchInput'); // input pencarian

  let kelasList = [];
  let kelompokList = [];
  let allSantri = [];

  // Ambil data kelas dari main process
  window.electronAPI.mintaDataKelas();
  window.electronAPI.terimaDataKelas((data) => {
    kelasList = data;

    if (filterKelas) {
      // Isi opsi filter kelas
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

  // Ambil data kelompok dari main process
  window.electronAPI.mintaDataKelompok();
  window.electronAPI.terimaDataKelompok((data) => {
    kelompokList = data;
    tryLoadSantri();
  });

  // Ambil data santri setelah data kelas dan kelompok sudah siap
  function tryLoadSantri() {
    if (kelasList.length === 0 || kelompokList.length === 0) return;

    window.electronAPI.mintaDataSantri();
    window.electronAPI.terimaDataSantri((dataSantri) => {
      allSantri = dataSantri;
      renderSantri();
    });
  }

  // Pasang event listener untuk pencarian
  if (searchInput) {
    searchInput.addEventListener('input', renderSantri);
  }

  // Fungsi render daftar santri dengan filter dan pencarian
  function renderSantri() {
    tbody.innerHTML = '';

    const selectedFilter = filterKelas ? filterKelas.value : '';
    const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';

    // Filter berdasarkan kelas dan pencarian nama/alias
    let santriFiltered = allSantri.filter(s => {
      // Filter kelas
      const matchKelas =
        selectedFilter === '' ||
        (selectedFilter === 'belum' &&
          (!s.kelas_utama || s.kelas_utama === '-' || s.kelas_utama === null || s.kelas_utama === '')) ||
        s.kelas_utama === selectedFilter ||
        s.kelas_extra === selectedFilter;

      // Filter pencarian nama atau alias
      const matchSearch =
        s.nama.toLowerCase().includes(keyword) ||
        (s.alias && s.alias.toLowerCase().includes(keyword));

      return matchKelas && matchSearch;
    });

    // Urutkan supaya yang belum punya kelas utama tampil dulu
    santriFiltered.sort((a, b) => {
      const aKosong = !a.kelas_utama || a.kelas_utama === '-' || a.kelas_utama === '';
      const bKosong = !b.kelas_utama || b.kelas_utama === '-' || b.kelas_utama === '';
      return aKosong === bKosong ? 0 : aKosong ? -1 : 1;
    });

    // Buat baris tabel per santri
    santriFiltered.forEach(santri => {
      const tr = document.createElement('tr');

      // Kolom Nama
      const tdNama = document.createElement('td');
      tdNama.textContent = santri.nama;
      tr.appendChild(tdNama);

      // Kolom Alias
      const tdAlias = document.createElement('td');
      tdAlias.textContent = santri.alias || '-';
      tr.appendChild(tdAlias);

      // Kolom Kelas Utama (dropdown)
      const tdKelasUtama = document.createElement('td');
      const selectKelasUtama = document.createElement('select');
      selectKelasUtama.appendChild(createOption('', '-- pilih kelas --', santri.kelas_utama));
      kelasList.forEach(k => {
        selectKelasUtama.appendChild(createOption(k.nama, k.nama, santri.kelas_utama));
      });
      tdKelasUtama.appendChild(selectKelasUtama);
      tr.appendChild(tdKelasUtama);

      // Kolom Kelas Ekstra (dropdown)
      const tdKelasExtra = document.createElement('td');
      const selectKelasExtra = document.createElement('select');
      selectKelasExtra.appendChild(createOption('', '-- tidak ada --', santri.kelas_extra));
      kelasList.forEach(k => {
        selectKelasExtra.appendChild(createOption(k.nama, k.nama, santri.kelas_extra));
      });
      tdKelasExtra.appendChild(selectKelasExtra);
      tr.appendChild(tdKelasExtra);

      // Kolom Kelompok (dropdown)
      const tdKelompok = document.createElement('td');
      const selectKelompok = document.createElement('select');
      selectKelompok.appendChild(createOption('', '-- tidak ada --', santri.kelompok));
      kelompokList.forEach(kel => {
        selectKelompok.appendChild(createOption(kel.nama, kel.nama, santri.kelompok));
      });
      tdKelompok.appendChild(selectKelompok);
      tr.appendChild(tdKelompok);

      // Kolom Status (dropdown)
      const tdStatus = document.createElement('td');
      const selectStatus = document.createElement('select');
      ['aktif', 'nonaktif', 'lulus', 'pindah'].forEach(s => {
        selectStatus.appendChild(createOption(s, s, santri.status));
      });
      tdStatus.appendChild(selectStatus);
      tr.appendChild(tdStatus);

      // Kolom aksi (tombol simpan)
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

  // Fungsi bantu membuat <option>
  function createOption(value, text, selectedValue) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    if (value === selectedValue) opt.selected = true;
    return opt;
  }
});
