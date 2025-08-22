window.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-kelompok');
  const tabel = document.querySelector('#tabel-kelompok tbody');
  const query = new URLSearchParams(window.location.search);
  const editId = query.get('id');

  if (form) {
    const namaInput = form.querySelector('[name="nama"]');
    const wali1Select = form.querySelector('#wali1');
    const wali2Select = form.querySelector('#wali2');
    const ketuaSelect = form.querySelector('#ketua');
    const kuSelect = form.querySelector('#ku');
    const penerobosSelect = form.querySelector('#penerobos');
    const btnKembali = document.getElementById('btn-kembali');
    const btnBatal = document.getElementById('btn-batal'); // tombol batal

    let dataGuruAll = [];
    let guruLoaded = false;

    // Isi dropdown wali1 dan wali2
    function populateWaliDropdown() {
      wali1Select.innerHTML = '<option value="">-- Pilih Wali 1 --</option>';
      wali2Select.innerHTML = '<option value="">-- Pilih Wali 2 --</option>';

      const uniqueNames = new Set();

      dataGuruAll.forEach(g => {
        if (!uniqueNames.has(g.nama)) {
          uniqueNames.add(g.nama);

          const option1 = document.createElement('option');
          option1.value = g.nama;
          option1.textContent = g.nama;

          wali1Select.appendChild(option1);
          wali2Select.appendChild(option1.cloneNode(true));
        }
      });
    }

    // Isi dropdown santri
    function populateSantriDropdown(namaKelompok) {
      window.electronAPI.mintaDataSantri();
      window.electronAPI.terimaDataSantri(dataSantri => {
        const santriKelompok = dataSantri.filter(s => s.kelompok === namaKelompok && s.status === 'aktif');

        ketuaSelect.innerHTML = '<option value="">-- Pilih Ketua --</option>';
        kuSelect.innerHTML = '<option value="">-- Pilih KU --</option>';
        penerobosSelect.innerHTML = '<option value="">-- Pilih Penerobos --</option>';

        santriKelompok.forEach(s => {
          const opt = document.createElement('option');
          opt.value = s.nama;
          opt.textContent = s.nama;

          ketuaSelect.appendChild(opt.cloneNode(true));
          kuSelect.appendChild(opt.cloneNode(true));
          penerobosSelect.appendChild(opt.cloneNode(true));
        });
      });
    }

    // Cek data sudah load lalu isi dropdown dan isi form jika edit
    function checkAndPopulate() {
      if (guruLoaded) {
        populateWaliDropdown();

        if (editId) {
          window.electronAPI.mintaDataKelompokById(parseInt(editId));
          window.electronAPI.terimaDataKelompokById(data => {
            if (!data) {
              alert('Data kelompok tidak ditemukan');
              window.location.href = './kelompok.html';
              return;
            }

            namaInput.value = data.nama;
            wali1Select.value = data.wali1 || '';
            wali2Select.value = data.wali2 || '';
            ketuaSelect.value = data.ketua || '';
            kuSelect.value = data.ku || '';
            penerobosSelect.value = data.penerobos || '';

            populateSantriDropdown(data.nama);
          });
        }
      }
    }

    // Ambil data guru
    window.electronAPI.mintaDataGuru();
    window.electronAPI.terimaDataGuru(data => {
      dataGuruAll = data;
      guruLoaded = true;
      checkAndPopulate();
    });

    // Saat nama kelompok diketik (mode tambah), isi dropdown santri
    namaInput.addEventListener('blur', () => {
      if (!editId && namaInput.value.trim()) {
        populateSantriDropdown(namaInput.value.trim());
      }
    });

    // Submit form simpan atau update kelompok
    form.addEventListener('submit', e => {
      e.preventDefault();

      const data = {
        nama: namaInput.value.trim(),
        wali1: wali1Select.value,
        wali2: wali2Select.value,
        ketua: ketuaSelect.value,
        ku: kuSelect.value,
        penerobos: penerobosSelect.value
      };

      if (editId) {
        window.electronAPI.updateKelompok(parseInt(editId), data);
        alert('Data kelompok diperbarui!');
      } else {
        window.electronAPI.kirimDataKelompok(data);
        alert('Data kelompok berhasil disimpan!');
      }

      window.location.href = './kelompok.html';
    });

    // Tombol Kembali
    btnKembali?.addEventListener('click', () => {
      window.location.href = './kelompok.html';
    });

    // Tombol Batal
    btnBatal?.addEventListener('click', () => {
      const konfirmasi = confirm('Batalkan perubahan?');
      if (konfirmasi) {
        if (editId) {
          window.location.href = `./input-kelompok.html?id=${editId}`; // reload form edit
        } else {
          form.reset(); // reset form jika tambah baru
        }
      }
    });
  }

  // ===== HALAMAN DAFTAR KELOMPOK =====
  if (tabel) {
    window.electronAPI.mintaDataKelompok();
    window.electronAPI.terimaDataKelompok(dataKelompok => {
      tabel.innerHTML = '';

      if (dataKelompok.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7">Belum ada kelompok</td>';
        tabel.appendChild(row);
        return;
      }

      dataKelompok.forEach(kelompok => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${kelompok.nama}</td>
          <td>${kelompok.wali1 || '-'}</td>
          <td>${kelompok.wali2 || '-'}</td>
          <td>${kelompok.ketua || '-'}</td>
          <td>${kelompok.ku || '-'}</td>
          <td>${kelompok.penerobos || '-'}</td>
          <td>
            <button class="btn-edit" data-id="${kelompok.id}">✏️</button>
            <button class="btn-hapus" data-id="${kelompok.id}">🗑️</button>
          </td>
        `;
        tabel.appendChild(row);
      });

      document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.href = `./input-kelompok.html?id=${btn.dataset.id}`;
        });
      });

      document.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', () => {
          if (confirm('Yakin ingin menghapus kelompok ini?')) {
            window.electronAPI.hapusKelompok(parseInt(btn.dataset.id));
            alert('Data kelompok dihapus.');
            window.location.reload();
          }
        });
      });
    });
  }
});
