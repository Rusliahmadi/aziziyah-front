document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('form-jurnal');
  const tanggalInput = document.getElementById('tanggal');
  const hariInput = document.getElementById('hari');
  const kelasSelect = document.getElementById('kelas');
  const guruSelect = document.getElementById('guru');
  const materiSelect = document.getElementById('materi');
  const targetInput = document.getElementById('target_halaman');
  const tercapaiInput = document.getElementById('halaman_dicapai');
  const statusInput = document.getElementById('status');
  const halInput = document.getElementById('hal');
  const ayatInput = document.getElementById('ayat');
  const jamMulai = document.getElementById('jam_mulai');
  const jamSelesai = document.getElementById('jam_selesai');
  const tabelJurnal = document.querySelector('#tabel-jurnal tbody');
  const selectGuru = document.getElementById('filterGuru');

  let daftarMateri = [];
  let dataJurnal = [];

  // === FORM INPUT ===
  if (form) {
    // Load Kelas
    fetch('/api/kelas')
      .then(res => res.json())
      .then(kelasList => {
        kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
        kelasList.forEach(kelas => {
          const opt = document.createElement('option');
          opt.value = kelas.nama;
          opt.textContent = kelas.nama;
          kelasSelect.appendChild(opt);
        });
      });

    // Load Guru
    fetch('/api/guru')
      .then(res => res.json())
      .then(guruList => {
        guruSelect.innerHTML = '<option value="">-- Pilih Guru --</option>';
        const filteredGuru = guruList.filter(guru =>
          guru.dapukan === 'Guru' || guru.dapukan === 'Guru Bujang'
        );
        filteredGuru.forEach(guru => {
          const opt = document.createElement('option');
          opt.value = guru.nama;
          opt.textContent = guru.nama;
          guruSelect.appendChild(opt);
        });
      });

    // Load Materi
    fetch('/api/materi')
      .then(res => res.json())
      .then(materiList => {
        daftarMateri = materiList;
      });

    // Kelas berubah → filter materi
    kelasSelect.addEventListener('change', () => {
      const kelasTerpilih = kelasSelect.value;
      materiSelect.innerHTML = '<option value="">-- Pilih Materi --</option>';
      targetInput.value = '';
      tercapaiInput.value = '';
      statusInput.value = '';
      if (halInput) halInput.value = '';
      if (ayatInput) ayatInput.value = '';

      const materiFiltered = daftarMateri.filter(m => m.kelas === kelasTerpilih);
      materiFiltered.forEach(materi => {
        const opt = document.createElement('option');
        opt.value = materi.id;
        opt.textContent = `${materi.jenis} - ${materi.materi}`;
        opt.dataset.targetPerHari = materi.target_per_hari;
        materiSelect.appendChild(opt);
      });
    });

    // Materi berubah → isi target
    materiSelect.addEventListener('change', () => {
      const opsi = materiSelect.selectedOptions[0];
      targetInput.value = opsi?.dataset.targetPerHari || '';
      tercapaiInput.value = '';
      statusInput.value = '';
    });

    // Hitung status
    tercapaiInput.addEventListener('input', () => {
      const target = Number(targetInput.value);
      const dicapai = Number(tercapaiInput.value);
      if (!target || !dicapai) {
        statusInput.value = '';
        return;
      }
      statusInput.value = dicapai >= target ? 'Tercapai' : 'Belum tercapai';
    });

    // Hitung nama hari
    tanggalInput.addEventListener('change', () => {
      const tanggal = new Date(tanggalInput.value);
      const hariNama = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      hariInput.value = isNaN(tanggal) ? '' : hariNama[tanggal.getDay()];
    });

    // Submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!tanggalInput.value || !hariInput.value || !kelasSelect.value ||
        !guruSelect.value || !materiSelect.value || !targetInput.value ||
        !tercapaiInput.value || !jamMulai.value || !jamSelesai.value) {
        alert('Mohon lengkapi semua data!');
        return;
      }

      const dataJurnal = {
        tanggal: tanggalInput.value,
        hari: hariInput.value,
        kelas: kelasSelect.value,
        guru: guruSelect.value,
        materi_id: materiSelect.value,
        materi_nama: materiSelect.selectedOptions[0].textContent,
        hal: halInput?.value || '',
        ayat: ayatInput?.value || '',
        target: Number(targetInput.value),
        tercapai: Number(tercapaiInput.value),
        status: statusInput.value,
        jam_mulai: jamMulai.value,
        jam_selesai: jamSelesai.value
      };

      fetch('/api/jurnal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataJurnal)
      })
        .then(res => {
          if (!res.ok) throw new Error('Gagal menyimpan jurnal');
          return res.json();
        })
        .then(() => {
          alert('Jurnal berhasil disimpan!');
          form.reset();
          materiSelect.innerHTML = '<option value="">-- Pilih Materi --</option>';
        })
        .catch(err => {
          alert('Terjadi kesalahan saat menyimpan jurnal');
          console.error(err);
        });
    });
  }

  // === REKAP JURNAL ===
  if (tabelJurnal) {
    fetch('/api/jurnal')
      .then(res => res.json())
      .then(dataList => {
        dataJurnal = dataList;

        const guruUnik = [...new Set(dataList.map(item => item.guru))];
        selectGuru.innerHTML = '<option value="">-- Semua Guru --</option>';
        guruUnik.forEach(guru => {
          const opt = document.createElement('option');
          opt.value = guru;
          opt.textContent = guru;
          selectGuru.appendChild(opt);
        });

        renderTabel(dataList);
      });

    selectGuru.addEventListener('change', () => {
      const selectedGuru = selectGuru.value;
      const filtered = selectedGuru
        ? dataJurnal.filter(item => item.guru === selectedGuru)
        : dataJurnal;
      renderTabel(filtered);
    });
  }

  // Hitung durasi
  function hitungDurasi(jm, js) {
    const [h1, m1] = jm.split(':').map(Number);
    const [h2, m2] = js.split(':').map(Number);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60;
    return `${Math.floor(diff / 60)}j ${diff % 60}m`;
  }

  // Render Tabel
  function renderTabel(data) {
    tabelJurnal.innerHTML = '';
    data.forEach(item => {
      const durasi = hitungDurasi(item.jam_mulai, item.jam_selesai);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.tanggal}</td>
        <td>${item.kelas}</td>
        <td>${item.guru}</td>
        <td>${item.jam_mulai}</td>
        <td>${item.jam_selesai}</td>
        <td>${durasi}</td>
        <td>${item.materi_nama || '-'}</td>
        <td>${item.hal || '-'}</td>
        <td>${item.ayat || '-'}</td>
        <td>${item.target}</td>
        <td>${item.tercapai}</td>
        <td>${item.status}</td>
      `;
      tabelJurnal.appendChild(tr);
    });
  }
});
