window.addEventListener('DOMContentLoaded', async () => {
  let dataKelompok = [];
  let dataSantri = [];
  let dataGuru = [];

  const form = document.getElementById('form-kelompok');
  const tbody = document.querySelector('#table-kelompok tbody');
  const btnInput = document.getElementById('btn-input-kelompok');
  const editId = sessionStorage.getItem('editKelompokId');

  const wali1Select = document.getElementById('wali1');
  const wali2Select = document.getElementById('wali2');
  const ketuaSelect = document.getElementById('ketua');
  const kuSelect = document.getElementById('ku');

  try {
    const [kelompokRes, guruRes, santriRes] = await Promise.all([
      fetch('/api/kelompok'),
      fetch('/api/guru'),
      fetch('/api/santri'),
    ]);

    dataKelompok = await kelompokRes.json();
    dataGuru = await guruRes.json();
    dataSantri = await santriRes.json();
  } catch (err) {
    console.error('Gagal mengambil data:', err);
    return;
  }

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

  // Filter guru dan santri yang aktif
  const guruAktif = dataGuru.filter(g => g.dapukan === 'Guru' || g.dapukan === 'Guru Bujang');
  const santriAktif = dataSantri.filter(s => s.status === 'aktif');

  // Isi dropdown wali & santri (jika form ditemukan)
  if (form) {
    isiDropdown(wali1Select, guruAktif, 'Wali 1');
    isiDropdown(wali2Select, guruAktif, 'Wali 2');
    isiDropdown(ketuaSelect, santriAktif, 'Ketua');
    isiDropdown(kuSelect, santriAktif, 'KU');

    // Jika edit
    if (editId) {
      const kelompokEdit = dataKelompok.find(k => k.id === parseInt(editId));
      if (kelompokEdit) {
        form.nama.value = kelompokEdit.nama;
        wali1Select.value = kelompokEdit.wali1 || '';
        wali2Select.value = kelompokEdit.wali2 || '';
        ketuaSelect.value = kelompokEdit.ketua || '';
        kuSelect.value = kelompokEdit.ku || '';
      }
    }

    // Submit form
    form.addEventListener('submit', async e => {
      e.preventDefault();

      const payload = {
        nama: form.nama.value.trim(),
        wali1: wali1Select.value,
        wali2: wali2Select.value,
        ketua: ketuaSelect.value,
        ku: kuSelect.value
      };

      if (!payload.nama || !payload.wali1 || !payload.ketua) {
        alert('Nama kelompok, wali1, dan ketua wajib diisi!');
        return;
      }

      try {
        if (editId) {
          await fetch(`/api/kelompok/${editId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          sessionStorage.removeItem('editKelompokId');
        } else {
          await fetch('/api/kelompok', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }

        alert('Data kelompok berhasil disimpan!');
        window.location.href = './daftar-kelompok.html';
      } catch (err) {
        alert('Gagal menyimpan data kelompok.');
        console.error(err);
      }
    });

    // Tombol batal
    document.getElementById('btn-batal')?.addEventListener('click', () => {
      sessionStorage.removeItem('editKelompokId');
      form.reset();
    });

    // Tombol kembali
    document.getElementById('btn-kembali')?.addEventListener('click', () => {
      sessionStorage.removeItem('editKelompokId');
      window.location.href = './daftar-kelompok.html';
    });
  }

  // Tombol input baru
  if (btnInput) {
    btnInput.addEventListener('click', () => {
      window.location.href = './input-kelompok.html';
    });
  }

  // Tampilkan tabel daftar kelompok
  if (tbody) {
    tbody.innerHTML = '';
    if (dataKelompok.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">Belum ada data kelompok.</td></tr>';
    } else {
      dataKelompok.forEach(kelompok => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${kelompok.nama}</td>
          <td>${kelompok.wali1 || '-'}</td>
          <td>${kelompok.wali2 || '-'}</td>
          <td>${kelompok.ketua || '-'}</td>
          <td>${kelompok.ku || '-'}</td>
          <td>
            <button class="btn-edit" data-id="${kelompok.id}" title="Edit">✏️</button>
            <button class="btn-hapus" data-id="${kelompok.id}" title="Hapus">🗑️</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // Tombol edit
      tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
          sessionStorage.setItem('editKelompokId', btn.dataset.id);
          window.location.href = './input-kelompok.html';
        });
      });

      // Tombol hapus
      tbody.querySelectorAll('.btn-hapus').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('Yakin ingin menghapus kelompok ini?')) return;
          try {
            await fetch(`/api/kelompok/${btn.dataset.id}`, {
              method: 'DELETE'
            });
            window.location.reload();
          } catch (err) {
            alert('Gagal menghapus data.');
            console.error(err);
          }
        });
      });
    }
  }
});
