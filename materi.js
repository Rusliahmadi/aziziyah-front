window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-materi');
  const kelasSelect = document.getElementById('kelas');
  const filterSelect = document.getElementById('filterKelas');
  const table = document.querySelector('#table-materi');
  const tbody = table?.querySelector('tbody');
  const btnInput = document.getElementById('btn-input-materi');
  const editId = sessionStorage.getItem('editMateriId');

  let semuaMateri = [];

  // === Fungsi bantu membuat opsi <option> ===
  function createOption(value, text, selectedValue = null) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = text;
    if (selectedValue !== null && value === selectedValue) {
      opt.selected = true;
    }
    return opt;
  }

  // === Isi Select Kelas untuk form input/edit ===
  if (kelasSelect) {
    window.electronAPI.mintaDataKelas();
    window.electronAPI.terimaDataKelas((kelasList) => {
      kelasSelect.innerHTML = '';
      kelasSelect.appendChild(createOption('', '-- Pilih Kelas --'));

      kelasList.forEach(kelas => {
        kelasSelect.appendChild(createOption(kelas.nama, kelas.nama));
      });

      // Mode edit: load data materi yang mau diedit
      if (editId && form) {
        window.electronAPI.mintaDataMateri();
        window.electronAPI.terimaDataMateri((materiList) => {
          const data = materiList.find(m => m.id === parseInt(editId));
          if (data) {
            form.jenis.value = data.jenis;
            form.materi.value = data.materi;
            form.kelas.value = data.kelas;
            form.jumlah_halaman.value = data.jumlah_halaman;
            // Ambil nomor halaman awal (sebelum tanda -)
            form.nomor_halaman.value = data.nomor_halaman?.split('-')[0] || '';
            form.target_per_hari.value = data.target_per_hari;
          }
        });
      }
    });
  }

  // === Form Submit ===
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const jumlah = parseInt(form.jumlah_halaman.value);
      const target = parseFloat(form.target_per_hari.value);
      const awalHal = parseInt(form.nomor_halaman.value);
      if (!form.kelas.value) {
        alert('Pilih kelas terlebih dahulu!');
        return;
      }
      if (isNaN(jumlah) || isNaN(target) || isNaN(awalHal)) {
        alert('Mohon isi halaman dan target per hari dengan benar!');
        return;
      }

      const akhirHal = awalHal + jumlah - 1;
      const rentangHalaman = `${awalHal}-${akhirHal}`;
      const hari = Math.ceil(jumlah / target);

      const data = {
        jenis: form.jenis.value,
        materi: form.materi.value,
        kelas: form.kelas.value,
        jumlah_halaman: jumlah,
        nomor_halaman: rentangHalaman,
        target_per_hari: target,
        hari_diperlukan: hari
      };

      if (editId) {
        window.electronAPI.updateMateri(parseInt(editId), data);
        alert('Materi berhasil diperbarui!');
        sessionStorage.removeItem('editMateriId');
      } else {
        window.electronAPI.kirimDataMateri(data);
        alert('Materi berhasil disimpan!');
      }

      window.location.href = './daftar-materi.html';
    });

    // Tombol batal dan kembali
    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editMateriId');
      window.location.href = './daftar-materi.html';
    });

    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editMateriId');
      window.location.href = './daftar-materi.html';
    });
  }

  // === Daftar Materi (Tabel) ===
  if (table && tbody) {
    btnInput?.addEventListener('click', () => {
      sessionStorage.removeItem('editMateriId');
      window.location.href = './input-materi.html';
    });

    window.electronAPI.mintaDataMateri();
    window.electronAPI.terimaDataMateri((materiList) => {
      semuaMateri = materiList;
      tampilkanMateri(materiList);
      isiDropdownFilter(materiList);
    });

    function tampilkanMateri(dataList) {
      tbody.innerHTML = '';
      dataList.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${m.jenis}</td>
          <td>${m.materi}</td>
          <td>${m.kelas}</td>
          <td>${m.jumlah_halaman}</td>
          <td>${m.nomor_halaman || '-'}</td>
          <td>${m.target_per_hari}</td>
          <td>${m.hari_diperlukan}</td>
          <td>
            <button class="btn-edit" data-id="${m.id}" title="Edit">✏️</button>
            <button class="btn-hapus" data-id="${m.id}" title="Hapus">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Pasang event edit
      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          sessionStorage.setItem('editMateriId', btn.dataset.id);
          window.location.href = './input-materi.html';
        });
      });

      // Pasang event hapus
      tbody.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Yakin hapus materi ini?')) {
            window.electronAPI.hapusMateri(parseInt(btn.dataset.id));
            alert('Materi dihapus!');
            // Refresh data materi setelah hapus
            window.electronAPI.mintaDataMateri();
          }
        });
      });
    }

    function isiDropdownFilter(dataList) {
      if (!filterSelect) return;

      const kelasUnik = [...new Set(dataList.map(m => m.kelas).filter(Boolean))].sort();
      filterSelect.innerHTML = '';
      filterSelect.appendChild(createOption('', '-- Semua Kelas --'));

      kelasUnik.forEach(kelas => {
        filterSelect.appendChild(createOption(kelas, kelas));
      });

      filterSelect.addEventListener('change', () => {
        const dipilih = filterSelect.value;
        const hasil = dipilih ? semuaMateri.filter(m => m.kelas === dipilih) : semuaMateri;
        tampilkanMateri(hasil);
      });
    }
  }
});
