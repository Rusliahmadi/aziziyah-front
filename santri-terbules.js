window.addEventListener('DOMContentLoaded', () => {
  const tanggalMulai = document.getElementById('tanggalMulai');
  const tanggalSampai = document.getElementById('tanggalSampai');
  const tombolTampilkan = document.getElementById('tombolTampilkan');
  const tbody = document.querySelector('#tabelSantri tbody');

  // Ketika tombol "Tampilkan" diklik
  tombolTampilkan.addEventListener('click', () => {
    const dari = tanggalMulai.value;
    const sampai = tanggalSampai.value;

    // Validasi input tanggal
    if (!dari || !sampai) {
      alert('Isi kedua tanggal terlebih dahulu.');
      return;
    }

    if (new Date(dari) > new Date(sampai)) {
      alert('Tanggal mulai tidak boleh melebihi tanggal sampai.');
      return;
    }

    // Kirim permintaan data absensi dengan filter tanggal
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

    // Konversi objek rekap ke array, hitung total ketidakhadiran dan urutkan
    const sorted = Object.values(rekap)
      .map(data => ({
        ...data,
        total: data.izin + data.sakit + data.alpa
      }))
      .sort((a, b) => b.total - a.total);

    // Render ke tabel
    tbody.innerHTML = '';
    sorted.forEach(s => {
      if (s.total === 0) return; // Lewatkan yang tidak memiliki ketidakhadiran

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

    // Jika tidak ada data tampilkan pesan
    if (sorted.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">Tidak ada data absensi untuk rentang tanggal tersebut.</td></tr>`;
    }
  });

  // Tombol kembali (jika ada)
  const tombolKembali = document.getElementById('tombolKembali');
  if (tombolKembali) {
    tombolKembali.addEventListener('click', () => {
      window.location.href = 'rekap-absen.html';
    });
  }
});
