window.addEventListener('DOMContentLoaded', () => {
  // Ambil elemen-elemen penting dari DOM
  const filterKelas = document.getElementById('filterKelas');
  const filterSesi = document.getElementById('filterSesi');
  const tanggalMulai = document.getElementById('tanggalMulai');
  const tanggalSampai = document.getElementById('tanggalSampai');
  const tombolRekap = document.getElementById('tombolRekap');
  const tbody = document.querySelector('#tabelRekap tbody');
  const totalEl = document.getElementById('totalKehadiran');
  const container = document.getElementById('kehadiran-container'); // opsional, dipakai di halaman lain

  // Format tanggal ke YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  // === 1. MUAT DATA SESI ===
  window.electronAPI.mintaDataSesi();
  window.electronAPI.terimaDataSesi((sesiList) => {
    if (!filterSesi) return;

    filterSesi.innerHTML = '<option value="">Semua Sesi</option>';
    sesiList.forEach((sesi) => {
      const opt = document.createElement('option');
      opt.value = sesi;
      opt.textContent = sesi;
      filterSesi.appendChild(opt);
    });
  });

  // === 2. MUAT DATA SANTRI ===
  window.electronAPI.mintaDataSantri();
  window.electronAPI.terimaDataSantri((dataSantri) => {
    // Isi dropdown kelas
    if (filterKelas) {
      const kelasSet = new Set();
      dataSantri.forEach(s => {
        if (s.kelas_utama) kelasSet.add(s.kelas_utama);
        if (s.kelas_extra) kelasSet.add(s.kelas_extra);
      });

      filterKelas.innerHTML = '';
      const defaultOpt = document.createElement('option');
      defaultOpt.value = '';
      defaultOpt.textContent = 'Pilih Kelas';
      filterKelas.appendChild(defaultOpt);

      [...kelasSet].sort().forEach(kelas => {
        const opt = document.createElement('option');
        opt.value = kelas;
        opt.textContent = kelas;
        filterKelas.appendChild(opt);
      });
    }

    // === 3. OPSIONAL: HITUNG PERSENTASE PER KELAS SELAMA 7 HARI TERAKHIR ===
    if (container) {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      const semuaKelas = [...new Set(dataSantri.map(s => s.kelas).filter(Boolean))];

      semuaKelas.forEach(kelas => {
        const filter = {
          kelas,
          dari: formatDate(lastWeek),
          sampai: formatDate(today)
        };
        window.electronAPI.mintaDataAbsen(filter);
      });
    }
  });

  // === 4. TOMBOL TAMPILKAN REKAP PER SANTRI ===
  if (tombolRekap) {
    tombolRekap.addEventListener('click', () => {
      const kelas = filterKelas.value;
      const sesi = filterSesi.value;
      const dari = tanggalMulai.value;
      const sampai = tanggalSampai.value;

      if (!dari || !sampai) {
        alert('Silakan isi rentang tanggal.');
        return;
      }

      const filter = { kelas, sesi, dari, sampai };
      window.electronAPI.mintaDataAbsen(filter);
    });
  }

  // === 5. TAMPILKAN DATA ABSEN PER SANTRI ===
  window.electronAPI.terimaDataAbsen((absenList) => {
    // Apakah ini untuk container (per kelas)?
    if (container && absenList.length > 0 && absenList[0].kelas) {
      const dataKelas = {};
      absenList.forEach(absen => {
        if (!dataKelas[absen.kelas]) {
          dataKelas[absen.kelas] = { hadir: 0, total: 0 };
        }
        if (absen.status === 'hadir') dataKelas[absen.kelas].hadir++;
        dataKelas[absen.kelas].total++;
      });

      container.innerHTML = '';
      for (const [kelas, data] of Object.entries(dataKelas)) {
        const persentase = data.total > 0 ? ((data.hadir / data.total) * 100).toFixed(1) : 0;

        const card = document.createElement('div');
        card.className = 'kelas-card';
        card.innerHTML = `
          <h3>${kelas}</h3>
          <div class="persentase">${persentase}%</div>
          <div class="detail">${data.hadir}/${data.total} hadir</div>
        `;
        container.appendChild(card);
      }

      return; // selesai di sini jika ini konteks "per kelas"
    }

    // Kalau tidak, berarti konteksnya rekap per santri (tabel)
    if (!tbody) return;

    const rekap = {};

    absenList.forEach(absen => {
      const nama = absen.nama;
      if (!rekap[nama]) {
        rekap[nama] = {
          hadir: 0,
          izin: 0,
          sakit: 0,
          alpa: 0,
          keterangan: [],
        };
      }

      rekap[nama][absen.status]++;
      if (absen.keterangan) {
        rekap[nama].keterangan.push(absen.keterangan);
      }
    });

    // Render ke tabel
    tbody.innerHTML = '';
    let totalHadir = 0;
    let totalEntri = 0;

    Object.entries(rekap).forEach(([nama, data]) => {
      const total = data.hadir + data.izin + data.sakit + data.alpa;
      const persentase = total > 0 ? Math.round((data.hadir / total) * 100) : 0;

      totalHadir += data.hadir;
      totalEntri += total;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${nama}</td>
        <td>${data.hadir}</td>
        <td>${data.izin}</td>
        <td>${data.sakit}</td>
        <td>${data.alpa}</td>
        <td>${data.keterangan.join('; ')}</td>
        <td>${persentase}%</td>
      `;
      tbody.appendChild(row);
    });

    // Tampilkan total persentase keseluruhan
    if (totalEl) {
      const totalPersen = totalEntri > 0 ? ((totalHadir / totalEntri) * 100).toFixed(1) : '0.0';
      totalEl.textContent = `Jumlah persentase kehadiran keseluruhan: ${totalPersen}%`;
    }
  });
});
