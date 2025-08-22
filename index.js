window.addEventListener('DOMContentLoaded', () => {
  const tbody = document.querySelector('#rekap-absen-kelas tbody');
  const container = document.getElementById('kelas-container');

  // === Tampilkan Rekap Absen ===
  window.electronAPI.mintaRekapAbsenIndex();

  window.electronAPI.terimaRekapAbsenIndex((data) => {
    const labels = [];
    const chartData = [];
    const backgroundColors = [];
    const borderColors = [];

    // Contoh warna — kamu bisa menambah lebih banyak warna jika datanya banyak
    const colorPalette = [
      'rgba(255, 99, 132, 0.6)',  // merah muda
      'rgba(54, 162, 235, 0.6)',  // biru
      'rgba(255, 206, 86, 0.6)',  // kuning
      'rgba(75, 192, 192, 0.6)',  // hijau kebiruan
      'rgba(153, 102, 255, 0.6)', // ungu
      'rgba(255, 159, 64, 0.6)',  // oranye
      'rgba(199, 199, 199, 0.6)'  // abu
    ];

    const borderPalette = colorPalette.map(c => c.replace('0.6', '1'));

    data.forEach((item, index) => {
      labels.push(item.kelas);
      chartData.push(parseFloat(item.persentase));
      backgroundColors.push(colorPalette[index % colorPalette.length]);
      borderColors.push(borderPalette[index % borderPalette.length]);
    });

    const ctx = document.getElementById("rekapAbsensiChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Persentase Kehadiran (%)",
          data: chartData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: "Persentase (%)"
            }
          }
        }
      }
    });
  });

  // === Tampilkan Kartu Jumlah Santri per Kelas dengan jumlah laki-laki dan perempuan ===
  if (container) {
    window.electronAPI.mintaDataSantri();
    window.electronAPI.terimaDataSantri((dataSantri) => {
      // Struktur data:
      // Map kelas -> { total: X, laki: Y, perempuan: Z }
      const kelasMap = new Map();

      dataSantri.forEach(santri => {
        // Periksa kelas utama dan kelas extra, catat semua
        const kelasList = [];
        if (santri.kelas_utama) kelasList.push(santri.kelas_utama);
        if (santri.kelas_extra) kelasList.push(santri.kelas_extra);

        kelasList.forEach(kelas => {
          if (!kelasMap.has(kelas)) {
            kelasMap.set(kelas, { total: 0, laki: 0, perempuan: 0 });
          }
          const info = kelasMap.get(kelas);
          info.total++;
          if (santri.jk === 'L') info.laki++;
          else if (santri.jk === 'P') info.perempuan++;
          kelasMap.set(kelas, info);
        });
      });

      container.innerHTML = '';

      [...kelasMap.entries()].sort().forEach(([kelas, info]) => {
        const card = document.createElement('div');
        card.className = 'kelas-card';
        card.innerHTML = `
          <h3>${kelas}</h3>
          <p>Total: ${info.total} santri</p>
          <p>Laki-laki: ${info.laki}</p>
          <p>Perempuan: ${info.perempuan}</p>
        `;
        container.appendChild(card);
      });
    });
  }

});
