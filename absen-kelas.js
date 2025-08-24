document.addEventListener('DOMContentLoaded', () => {
  const selectKelas = document.getElementById('pilihKelas');
  const selectSesi = document.getElementById('pilihSesi');
  const tanggalInput = document.getElementById('tanggalAbsen');
  const tbody = document.querySelector('#table-absen tbody');
  const form = document.getElementById('form-absen');

  let semuaSantri = [];

  // Set default tanggal hari ini
  tanggalInput.valueAsDate = new Date();

  // Ambil data santri dari API
  fetch('/api/santri')
    .then(res => res.json())
    .then(data => {
      semuaSantri = data.map(s => ({
        ...s,
        kelas: s.kelas_utama || ''
      }));
      isiDropdownKelas(semuaSantri);
    })
    .catch(err => {
      console.error('Gagal mengambil data santri:', err);
      alert('Gagal mengambil data santri.');
    });

  function isiDropdownKelas(data) {
    const kelasSet = new Set();

    data.forEach(s => {
      if (s.kelas_utama) kelasSet.add(s.kelas_utama);
      if (s.kelas_extra) kelasSet.add(s.kelas_extra);
    });

    [...kelasSet].sort().forEach(kelas => {
      const opt = document.createElement('option');
      opt.value = kelas;
      opt.textContent = kelas;
      selectKelas.appendChild(opt);
    });
  }

  selectKelas.addEventListener('change', () => {
    const kelasDipilih = selectKelas.value;

    const dataKelas = semuaSantri.filter(s =>
      s.kelas_utama === kelasDipilih || s.kelas_extra === kelasDipilih
    );

    renderTabelAbsen(dataKelas);
  });

  function renderTabelAbsen(santriList) {
    tbody.innerHTML = '';

    santriList.forEach((santri, i) => {
      const tr = document.createElement('tr');
      tr.dataset.nama = santri.nama;
      tr.dataset.alias = santri.alias || '';

      tr.innerHTML = `
        <td>${santri.nama}</td>
        <td>${santri.alias || '-'}</td>
        <td><input type="radio" name="absen-${i}" value="hadir" checked required></td>
        <td><input type="radio" name="absen-${i}" value="izin"></td>
        <td><input type="radio" name="absen-${i}" value="sakit"></td>
        <td><input type="radio" name="absen-${i}" value="alpa"></td>
        <td><input type="text" name="keterangan-${i}" placeholder="Keterangan jika ada"></td>
      `;

      tbody.appendChild(tr);
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const tanggal = tanggalInput.value;
    const kelas = selectKelas.value;
    const sesi = selectSesi.value;

    if (!tanggal || !kelas || !sesi) {
      alert('Harap pilih kelas, sesi, dan tanggal terlebih dahulu.');
      return;
    }

    const dataAbsen = [];

    const rows = document.querySelectorAll('#table-absen tbody tr');
    rows.forEach((row, i) => {
      const nama = row.dataset.nama;
      const alias = row.dataset.alias || '';

      const radioGroup = form.querySelectorAll(`input[name="absen-${i}"]`);
      let status = 'hadir';

      radioGroup.forEach(radio => {
        if (radio.checked) {
          status = radio.value;
        }
      });

      if (status !== 'hadir') {
        row.style.backgroundColor = '#fff3cd'; // kuning muda
      }

      const keteranganInput = form[`keterangan-${i}`];
      const keterangan = keteranganInput ? keteranganInput.value : '';

      dataAbsen.push({
        nama,
        alias,
        kelas,
        tanggal,
        sesi,
        status,
        keterangan
      });
    });

    // Kirim data ke backend
    fetch('/api/absen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dataAbsen)
    })
      .then(res => {
        if (!res.ok) throw new Error('Gagal menyimpan data');
        return res.json();
      })
      .then(() => {
        alert('Data absen berhasil disimpan!');
        tbody.innerHTML = '';
        selectKelas.value = '';
        selectSesi.value = '';
      })
      .catch(err => {
        console.error('Gagal kirim data absen:', err);
        alert('Terjadi kesalahan saat menyimpan data.');
      });
  });
});
