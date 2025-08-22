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
    // Load kelas
    window.electronAPI.mintaDataKelas();
    window.electronAPI.terimaDataKelas((kelasList) => {
      kelasSelect.innerHTML = '<option value="">-- Pilih Kelas --</option>';
      kelasList.forEach(kelas => {
        const opt = document.createElement('option');
        opt.value = kelas.nama || kelas;
        opt.textContent = kelas.nama || kelas;
        kelasSelect.appendChild(opt);
      });
    });

    // Load guru (hanya Guru & Guru Bujang)
    window.electronAPI.mintaDataGuru();
    window.electronAPI.terimaDataGuru((guruList) => {
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

    // Load materi
    window.electronAPI.mintaDataMateri();
    window.electronAPI.terimaDataMateri((materiList) => {
      daftarMateri = materiList;
    });

    // Filter materi saat kelas dipilih
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

    // Auto isi target halaman dari materi
    materiSelect.addEventListener('change', () => {
      const opsi = materiSelect.selectedOptions[0];
      targetInput.value = opsi?.dataset.targetPerHari || '';
      tercapaiInput.value = '';
      statusInput.value = '';
    });

    // Hitung status tercapai
    tercapaiInput.addEventListener('input', () => {
      const target = Number(targetInput.value);
      const dicapai = Number(tercapaiInput.value);
      if (!target || !dicapai) {
        statusInput.value = '';
        return;
      }
      statusInput.value = dicapai >= target ? 'Tercapai' : 'Belum tercapai';
    });

    // Auto hitung nama hari
    tanggalInput.addEventListener('change', () => {
      const tanggal = new Date(tanggalInput.value);
      if (isNaN(tanggal)) {
        hariInput.value = '';
        return;
      }
      const hariNama = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      hariInput.value = hariNama[tanggal.getDay()];
    });

    // Submit form
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

      window.electronAPI.kirimDataJurnal(dataJurnal);
      alert('Jurnal berhasil disimpan!');

      // Reset
      form.reset();
      materiSelect.innerHTML = '<option value="">-- Pilih Materi --</option>';
    });
  }

  // === REKAP JURNAL ===
  if (tabelJurnal) {
    window.electronAPI.mintaDataJurnal();

    window.electronAPI.terimaDataJurnal((dataList) => {
      if (!Array.isArray(dataList)) {
        console.warn('Data jurnal tidak valid:', dataList);
        return;
      }

      dataJurnal = dataList;

      // Isi filter guru
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

    // Filter guru
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

  // Render tabel
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
