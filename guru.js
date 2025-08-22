window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-guru');
  const tbody = document.querySelector('#table-guru tbody');
  const btnInput = document.getElementById('btn-input-guru');
  const editId = sessionStorage.getItem('editGuruId');

  // === FORM INPUT GURU ===
  if (form) {
    if (editId) {
      // === MODE EDIT ===
      window.electronAPI.mintaDataGuru();
      window.electronAPI.terimaDataGuru((dataGuruList) => {
        const guru = dataGuruList.find(g => g.id === parseInt(editId));
        if (guru) {
          form.nama.value = guru.nama;
          form.alamat.value = guru.alamat;
          form.no_hp.value = guru.no_hp;
          form.dapukan.value = guru.dapukan || '';
          form.mulai_bertugas.value = guru.mulai_bertugas;
        }
      });

      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataGuru = {
          nama: form.nama.value,
          alamat: form.alamat.value,
          no_hp: form.no_hp.value,
          dapukan: form.dapukan.value,
          mulai_bertugas: form.mulai_bertugas.value,
        };
        window.electronAPI.updateGuru(parseInt(editId), dataGuru);
        alert('Data guru berhasil diperbarui!');
        sessionStorage.removeItem('editGuruId');
        window.location.href = './data-guru.html';
      });
    } else {
      // === MODE TAMBAH BARU ===
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dataGuru = {
          nama: form.nama.value,
          alamat: form.alamat.value,
          no_hp: form.no_hp.value,
          dapukan: form.dapukan.value,
          mulai_bertugas: form.mulai_bertugas.value,
          wali_kelas: "",
          wali_kelompok: "",
        };
        window.electronAPI.kirimDataGuru(dataGuru);
        alert('Data guru berhasil disimpan!');
        sessionStorage.removeItem('form-guru');
        window.location.href = 'data-guru.html';
      });
    }

    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editGuruId');
    });

    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editGuruId');
      window.location.href = './data-guru.html';
    });
  }

  // === TOMBOL INPUT GURU BARU ===
  if (btnInput) {
    btnInput.addEventListener('click', () => {
      window.location.href = './input-data-guru.html';
    });
  }

  // === TAMPILKAN DAFTAR GURU ===
  if (tbody) {
    loadDataGuru();
  }

  // === FUNGSI MEMUAT TABEL GURU ===
  function loadDataGuru() {
    Promise.all([
      new Promise(resolve => {
        window.electronAPI.mintaDataGuru();
        window.electronAPI.terimaDataGuru(resolve);
      }),
      new Promise(resolve => {
        window.electronAPI.mintaDataKelas();
        window.electronAPI.terimaDataKelas(resolve);
      }),
      new Promise(resolve => {
        window.electronAPI.mintaDataKelompok();
        window.electronAPI.terimaDataKelompok(resolve);
      }),
    ]).then(([dataGuru, dataKelas, dataKelompok]) => {
      tbody.innerHTML = '';

      dataGuru.forEach((guru) => {
        const kelasDipegang = dataKelas.find(k => k.wali_kelas === guru.nama);
        const waliKelas = kelasDipegang ? kelasDipegang.nama : '';

        const kelompokDipegang = dataKelompok.find(k => k.wali1 === guru.nama || k.wali2 === guru.nama);
        const waliKelompok = kelompokDipegang ? kelompokDipegang.nama : '';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${guru.nama}</td>
          <td>${guru.alamat}</td>
          <td>${guru.no_hp}</td>
          <td>${guru.dapukan || ''}</td>
          <td>${guru.mulai_bertugas}</td>
          <td>${waliKelas}</td>
          <td>${waliKelompok}</td>
          <td>
            <button class="btn-edit" data-id="${guru.id}">✏️</button>
            <button class="btn-hapus" data-id="${guru.id}">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // === HAPUS GURU ===
      document.querySelectorAll('.btn-hapus').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          if (confirm('Yakin ingin menghapus guru ini?')) {
            window.electronAPI.hapusGuru(parseInt(id));
            alert('Data guru berhasil dihapus.');
            loadDataGuru();
          }
        });
      });

      // === EDIT GURU ===
      document.querySelectorAll('.btn-edit').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          sessionStorage.setItem('editGuruId', id);
          window.location.href = './input-data-guru.html';
        });
      });
    });
  }
});
