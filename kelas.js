window.addEventListener('DOMContentLoaded', () => {
  let dataSantri = [];
  let dataGuru = [];
  let dataKelas = JSON.parse(localStorage.getItem('kelas')) || [];

  const form = document.getElementById('form-kelas');
  const tbody = document.querySelector('#table-kelas tbody');
  const waliKelasSelect = document.getElementById('wali_kelas');
  const ketuaSelect = document.getElementById('ketua');
  const kuSelect = document.getElementById('ku');
  const penerobosSelect = document.getElementById('penerobos');
  const btnInput = document.getElementById('btn-input-kelas');
  const editId = sessionStorage.getItem('editKelasId');

  // Ambil data santri dan guru dari localStorage (atau dummy jika belum ada)
  dataSantri = JSON.parse(localStorage.getItem('santri')) || [];
  dataGuru = JSON.parse(localStorage.getItem('guru')) || [];

  // Fungsi isi dropdown
  function isiDropdown(selectEl, items, placeholder) {
    selectEl.innerHTML = `<option disabled selected>-- Pilih ${placeholder} --</option>`;
    items.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.nama;
      opt.textContent = item.nama;
      selectEl.appendChild(opt);
    });
  }

  function filterSantriByKelas(namaKelas) {
    return dataSantri.filter(s =>
      s.status === 'aktif' && (s.kelas_utama === namaKelas || s.kelas_extra === namaKelas)
    );
  }

  function updateSantriDropdowns(namaKelas) {
    const filtered = filterSantriByKelas(namaKelas);
    isiDropdown(ketuaSelect, filtered, 'Ketua');
    isiDropdown(kuSelect, filtered, 'KU');
    isiDropdown(penerobosSelect, filtered, 'Penerobos');
  }

  // Filter hanya guru dengan dapukan 'Guru' saja
  const guruYangValid = dataGuru.filter(guru => guru.dapukan === 'Guru');
  isiDropdown(waliKelasSelect, guruYangValid, 'Wali Kelas');

  if (editId && form) {
    const kelasEdit = dataKelas.find(k => k.id === parseInt(editId));
    if (kelasEdit) {
      form.nama.value = kelasEdit.nama;
      form.wali_kelas.value = kelasEdit.wali_kelas || '';
      updateSantriDropdowns(kelasEdit.nama);
      ketuaSelect.value = kelasEdit.ketua || '';
      kuSelect.value = kelasEdit.ku || '';
      penerobosSelect.value = kelasEdit.penerobos || '';
    }
  }

  if (form) {
    form.nama.addEventListener('input', e => {
      const namaKelas = e.target.value.trim();
      if (namaKelas) {
        updateSantriDropdowns(namaKelas);
      } else {
        isiDropdown(ketuaSelect, [], 'Ketua');
        isiDropdown(kuSelect, [], 'KU');
        isiDropdown(penerobosSelect, [], 'Penerobos');
      }
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const payload = {
        id: editId ? parseInt(editId) : Date.now(),
        nama: form.nama.value.trim(),
        wali_kelas: form.wali_kelas.value,
        ketua: ketuaSelect.value,
        ku: kuSelect.value,
        penerobos: penerobosSelect.value
      };

      if (editId) {
        // Update kelas
        const index = dataKelas.findIndex(k => k.id === parseInt(editId));
        if (index !== -1) {
          dataKelas[index] = payload;
        }
        sessionStorage.removeItem('editKelasId');
        localStorage.setItem('kelas', JSON.stringify(dataKelas));
        window.location.href = './daftar-kelas.html';
      } else {
        // Tambah kelas baru
        dataKelas.push(payload);
        localStorage.setItem('kelas', JSON.stringify(dataKelas));
        alert('Data kelas berhasil disimpan!');
        form.reset();
      }
    });

    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editKelasId');
      form.reset();
    });

    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editKelasId');
      window.location.href = './daftar-kelas.html';
    });
  }

  if (btnInput) {
    btnInput.addEventListener('click', () => {
      window.location.href = './input-kelas.html';
    });
  }

  // Tampilkan daftar kelas di halaman daftar-kelas.html
  if (tbody) {
    tbody.innerHTML = '';
    dataKelas.forEach(kl => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${kl.nama}</td>
        <td>${kl.wali_kelas || '-'}</td>
        <td>${kl.ketua || '-'}</td>
        <td>${kl.ku || '-'}</td>
        <td>${kl.penerobos || '-'}</td>
        <td>
          <button class="btn-edit-form" data-id="${kl.id}" title="Edit">✏️</button>
          <button class="btn-hapus" data-id="${kl.id}" title="Hapus">🗑️</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.btn-edit-form').forEach(btn => {
      btn.addEventListener('click', () => {
        sessionStorage.setItem('editKelasId', btn.dataset.id);
        window.location.href = './input-kelas.html';
      });
    });

    tbody.querySelectorAll('.btn-hapus').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm('Yakin ingin menghapus kelas ini?')) {
          const id = parseInt(btn.dataset.id);
          dataKelas = dataKelas.filter(k => k.id !== id);
          localStorage.setItem('kelas', JSON.stringify(dataKelas));
          // Refresh halaman agar data terupdate
          window.location.reload();
        }
      });
    });
  }
});
