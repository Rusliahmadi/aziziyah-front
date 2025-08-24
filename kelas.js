window.addEventListener('DOMContentLoaded', async () => {
  let dataSantri = [];
  let dataGuru = [];
  let dataKelas = [];

  const form = document.getElementById('form-kelas');
  const tbody = document.querySelector('#table-kelas tbody');
  const waliKelasSelect = document.getElementById('wali_kelas');
  const ketuaSelect = document.getElementById('ketua');
  const kuSelect = document.getElementById('ku');
  const penerobosSelect = document.getElementById('penerobos');
  const btnInput = document.getElementById('btn-input-kelas');
  const editId = sessionStorage.getItem('editKelasId');

  // Fetch semua data
  try {
    const [santriRes, guruRes, kelasRes] = await Promise.all([
      fetch('/api/santri'),
      fetch('/api/guru'),
      fetch('/api/kelas')
    ]);

    dataSantri = await santriRes.json();
    dataGuru = await guruRes.json();
    dataKelas = await kelasRes.json();
  } catch (err) {
    console.error('Gagal memuat data:', err);
    return;
  }

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

  const guruValid = dataGuru.filter(guru => guru.dapukan === 'Guru');
  isiDropdown(waliKelasSelect, guruValid, 'Wali Kelas');

  if (editId && form) {
    const kelasEdit = dataKelas.find(k => k.id === parseInt(editId));
    if (kelasEdit) {
      form.nama.value = kelasEdit.nama;
      waliKelasSelect.value = kelasEdit.wali_kelas || '';
      updateSantriDropdowns(kelasEdit.nama);
      ketuaSelect.value = kelasEdit.ketua || '';
      kuSelect.value = kelasEdit.ku || '';
      penerobosSelect.value = kelasEdit.penerobos || '';
    }
  }

  if (form) {
    form.nama.addEventListener('input', e => {
      const namaKelas = e.target.value.trim();
      namaKelas ? updateSantriDropdowns(namaKelas)
                : [ketuaSelect, kuSelect, penerobosSelect].forEach(s => s.innerHTML = '');
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const payload = {
        nama: form.nama.value.trim(),
        wali_kelas: waliKelasSelect.value,
        ketua: ketuaSelect.value,
        ku: kuSelect.value,
        penerobos: penerobosSelect.value
      };

      try {
        if (editId) {
          await fetch(`/api/kelas/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          sessionStorage.removeItem('editKelasId');
        } else {
          await fetch('/api/kelas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        alert('Data kelas berhasil disimpan!');
        window.location.href = './daftar-kelas.html';
      } catch (err) {
        alert('Gagal menyimpan data.');
        console.error(err);
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
          <button class="btn-edit-form" data-id="${kl.id}">✏️</button>
          <button class="btn-hapus" data-id="${kl.id}">🗑️</button>
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
      btn.addEventListener('click', async () => {
        if (!confirm('Yakin ingin menghapus kelas ini?')) return;
        try {
          await fetch(`/api/kelas/${btn.dataset.id}`, { method: 'DELETE' });
          window.location.reload();
        } catch (err) {
          alert('Gagal menghapus data.');
          console.error(err);
        }
      });
    });
  }
});
