window.addEventListener('DOMContentLoaded', () => {
  let dataSantri = [];
  let dataGuru = [];

  const form = document.getElementById('form-kelas');
  const tbody = document.querySelector('#table-kelas tbody');
  const waliKelasSelect = document.getElementById('wali_kelas');
  const ketuaSelect = document.getElementById('ketua');
  const kuSelect = document.getElementById('ku');
  const penerobosSelect = document.getElementById('penerobos');
  const btnInput = document.getElementById('btn-input-kelas');
  const editId = sessionStorage.getItem('editKelasId');

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

  // ==== FORM ====
  if (form) {
    window.electronAPI.mintaDataGuru();
    window.electronAPI.terimaDataGuru(g => {
      dataGuru = g;

      // Filter hanya guru dengan dapukan 'Guru' saja
      const guruYangValid = dataGuru.filter(guru => guru.dapukan === 'Guru');

      isiDropdown(waliKelasSelect, guruYangValid, 'Wali Kelas');

      window.electronAPI.mintaDataSantri();
      window.electronAPI.terimaDataSantri(s => {
        dataSantri = s;

        if (editId) {
          window.electronAPI.mintaDataKelas();
          window.electronAPI.terimaDataKelas(kc => {
            const kl = kc.find(x => x.id === parseInt(editId));
            if (kl) {
              form.nama.value = kl.nama;
              form.wali_kelas.value = kl.wali_kelas || '';
              updateSantriDropdowns(kl.nama);
              ketuaSelect.value = kl.ketua || '';
              kuSelect.value = kl.ku || '';
              penerobosSelect.value = kl.penerobos || '';
            }
          });
        }

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
      });
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const payload = {
        nama: form.nama.value,
        wali_kelas: form.wali_kelas.value,
        ketua: ketuaSelect.value,
        ku: kuSelect.value,
        penerobos: penerobosSelect.value
      };

      if (editId) {
        window.electronAPI.updateKelas(parseInt(editId), payload);
        sessionStorage.removeItem('editKelasId');
        window.location.href = './daftar-kelas.html';
      } else {
        window.electronAPI.kirimDataKelas(payload);
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

  // ==== TOMBOL INPUT KELAS ====
  if (btnInput) {
    btnInput.addEventListener('click', () => {
      window.location.href = './input-kelas.html';
    });
  }

  // ==== DAFTAR KELAS ====
  if (tbody) {
    window.electronAPI.mintaDataKelas();
    window.electronAPI.terimaDataKelas(kc => {
      tbody.innerHTML = '';
      kc.forEach(kl => {
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
            window.electronAPI.hapusKelas(parseInt(btn.dataset.id));
            window.location.reload();
          }
        });
      });
    });
  }
});
