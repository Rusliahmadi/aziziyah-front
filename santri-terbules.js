window.addEventListener('DOMContentLoaded', () => {
  const tanggalMulai = document.getElementById('tanggalMulai');
  const tanggalSampai = document.getElementById('tanggalSampai');
  const tombolTampilkan = document.getElementById('tombolTampilkan');
  const tbody = document.querySelector('#tabelSantri tbody');

  // Tombol "Tampilkan" ditekan
  tombolTampilkan.addEventListener('click', () => {
    const dari = tanggalMulai.value;
    const sampai = tanggalSampai.value;

    if (!dari || !sampai) {
      alert('Isi kedua tanggal terlebih dahulu.');
      return;
    }

    if (new Date(dari) > new Date(sampai)) {
      alert('Tanggal mulai tidak boleh melebihi tanggal sampai.');
      return;
    }

    const filter = { kelas: '', sesi: '', dari, sampai };
    window.electronAPI.mintaDataAbsen(filter);
  });

  // Terima data absen dari main process
  window.electronAPI.terimaDataAbsen((absenList) => {
    const rekap = {};

    absenList.forEach(absen => {
      if (!absen.nama || !absen.kelas || !absen.status) return;

      if (!rekap[absen.nama]) {
        rekap[absen.nama] = {
          nama: absen.nama,
          kelas: absen.kelas,
          izin: 0,
          sakit: 0,
          alpa: 0
        };
      }

      if (absen.status === 'izin') rekap[absen.nama].izin++;
      else if (absen.status === 'sakit') rekap[absen.nama].sakit++;
      else if (absen.status === 'alpa') rekap[absen.nama].alpa++;
    });

    const sorted = Object.values(rekap).map(data => ({
      ...data,
      total: data.izin + data.sakit + data.alpa
    })).sort((a, b) => b.total - a.total);

    tbody.innerHTML = '';
    sorted.forEach(s => {
      if (s.total === 0) return;

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${s.nama}</td>
        <td>${s.kelas}</td>
        <td>${s.izin}</td>
        <td>${s.sakit}</td>
        <td>${s.alpa}</td>
        <td>${s.total}</td>
      `;
      tbody.appendChild(row);
    });
  });

  // Tombol kembali (jika ada)
  const tombolKembali = document.getElementById('tombolKembali');
  if (tombolKembali) {
    tombolKembali.addEventListener('click', () => {
      window.location.href = 'rekap-absen.html';
    });
  }
});
