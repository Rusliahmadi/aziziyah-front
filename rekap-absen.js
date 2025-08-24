window.addEventListener('DOMContentLoaded', () => {
  const filterKelas = document.getElementById('filterKelas');
  const filterSesi = document.getElementById('filterSesi');
  const tanggalMulai = document.getElementById('tanggalMulai');
  const tanggalSampai = document.getElementById('tanggalSampai');
  const tombolRekap = document.getElementById('tombolRekap');
  const tbody = document.querySelector('#tabelRekap tbody');
  const totalEl = document.getElementById('totalKehadiran');
  const container = document.getElementById('kehadiran-container');

  const formatDate = (date) => date.toISOString().split('T')[0];

  let dataSantri = [];
  let dataAbsen = [];
  let dataSesi = [];

  // === 1. MUAT DATA SESI ===
  fetch('data/sesi.json').then(res => res.json()).then(sesiList => {
    dataSesi = sesiList;
    if (!filterSesi) return;
    filterSesi.innerHTML = '<option value="">Semua Sesi</option>';
    dataSesi.forEach(sesi => {
      const opt = document.createElement('option');
      opt.value = sesi;
      opt.textContent = sesi;
      filterSesi.appendChild(opt);
    });
  });

  // === 2. MUAT DATA SANTRI ===
  fetch('data/santri.json').then(res => res.json()).then(santri => {
    dataSantri = santri;

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

    // === 3. OPSIONAL: KEHADIRAN PER KELAS 7 HARI TERAKHIR ===
    if (container) {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);

      fetchDataAbsen().then(absenList => {
        const semuaKelas = [...new Set(dataSantri.map(s => s.kelas_utama).filter(Boolean))];
        container.innerHTML = '';

        semuaKelas.forEach(kelas => {
          const filtered = absenList.filter(absen =>
            absen.kelas === kelas &&
            absen.tanggal >= formatDate(lastWeek) &&
            absen.tanggal <= formatDate(today)
          );

          const hadir = filtered.filter(a => a.status === 'hadir').length;
          const total = filtered.length;
          const persentase = total > 0 ? ((hadir / total) * 100).toFixed(1) : '0.0';

          const card = document.createElement('div');
          card.className = 'kelas-card';
          card.innerHTML = `
            <h3>${kelas}</h3>
            <div class="persentase">${persentase}%</div>
            <div class="detail">${hadir}/${total} hadir</div>
          `;
          container.appendChild(card);
        });
      });
    }
  });

  // === 4. TOMBOL REKAP ===
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

      fetchDataAbsen().then(absenList => {
        const filtered = absenList.filter(absen => {
          const matchKelas = !kelas || absen.kelas === kelas;
          const matchSesi = !sesi || absen.sesi === sesi;
          const matchTanggal = absen.tanggal >= dari && absen.tanggal <= sampai;
          return matchKelas && matchSesi && matchTanggal;
        });

        tampilkanRekap(filtered);
      });
    });
  }

  // === 5. FUNGSI TAMPILKAN REKAP KE TABEL ===
  function tampilkanRekap(absenList) {
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

    tbody.innerHTML = '';
    let totalHadir = 0;
    let totalEntri = 0;

    Object.entries(rekap).forEach(([nama, data]) => {
      const total = data.hadir + data.izin + data.sakit + data.alpa;
      const persen = total > 0 ? Math.round((data.hadir / total) * 100) : 0;
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
        <td>${persen}%</td>
      `;
      tbody.appendChild(row);
    });

    if (totalEl) {
      const totalPersen = totalEntri > 0 ? ((totalHadir / totalEntri) * 100).toFixed(1) : '0.0';
      totalEl.textContent = `Jumlah persentase kehadiran keseluruhan: ${totalPersen}%`;
    }
  }

  // === HELPER: FETCH DATA ABSEN ===
  function fetchDataAbsen() {
    return new Promise((resolve, reject) => {
      const local = localStorage.getItem('absenData');
      if (local) {
        try {
          const json = JSON.parse(local);
          resolve(json);
        } catch (e) {
          reject(e);
        }
      } else {
        fetch('data/absen.json')
          .then(res => res.json())
          .then(json => resolve(json))
          .catch(err => reject(err));
      }
    });
  }
});
