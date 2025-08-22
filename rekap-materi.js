window.addEventListener('DOMContentLoaded', () => {
  const isIndexPage = window.location.pathname.includes('index.html');
  const isRekapPage = window.location.pathname.includes('rekap-materi.html');

  const tbody = document.querySelector('#rekap-table tbody');
  const canvas = document.getElementById('rekapMateriChart');

  let semuaMateri = [];
  let dataRekap = [];

  // 1. Minta data materi
  window.electronAPI.mintaDataMateri();
  window.electronAPI.terimaDataMateri((materiList) => {
    semuaMateri = materiList;

    if (isRekapPage && dataRekap.length > 0) {
      renderTabel(dataRekap);
    }
  });

  // 2. Minta data rekap materi
  window.electronAPI.mintaRekapMateri({});

  window.electronAPI.onBalasRekapMateri((res) => {
    if (!res.success) {
      if (isRekapPage && tbody) {
        tbody.innerHTML = `<tr><td colspan="6">${res.message}</td></tr>`;
      } else {
        console.error(res.message);
      }
      return;
    }

    dataRekap = res.data;

    if (isRekapPage && tbody && semuaMateri.length > 0) {
      renderTabel(dataRekap);
    }

    if (isIndexPage && canvas) {
      renderChart(dataRekap);
    }
  });

  // === TABEL REKAP ===
  function renderTabel(dataRekap) {
    if (!dataRekap || dataRekap.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">Tidak ada data.</td></tr>`;
      return;
    }

    tbody.innerHTML = '';

    dataRekap.forEach(row => {
      const relatedMateri = semuaMateri.filter(m => m.jenis === row.jenis && m.kelas === row.kelas);
      const totalHari = relatedMateri.reduce((sum, m) => sum + (m.hari_diperlukan || 0), 0);

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.jenis}</td>
        <td>${row.kelas}</td>
        <td>${row.jumlah_halaman}</td>
        <td>${totalHari}</td>
        <td>${row.dicapai}</td>
        <td>${row.tercapai} %</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // === CHART REKAP ===
  function renderChart(data) {
    const ctx = canvas.getContext('2d');
    const labels = [];
    const values = [];
    const colors = [];

    const colorPalette = [
      'rgba(255, 99, 132, 0.6)',
      'rgba(54, 162, 235, 0.6)',
      'rgba(255, 206, 86, 0.6)',
      'rgba(75, 192, 192, 0.6)',
      'rgba(153, 102, 255, 0.6)',
      'rgba(255, 159, 64, 0.6)'
    ];

    data.forEach((item, index) => {
      labels.push(`${item.kelas} - ${item.jenis}`);
      values.push(parseFloat(item.tercapai));
      colors.push(colorPalette[index % colorPalette.length]);
    });

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Tingkat Capaian (%)',
          data: values,
          backgroundColor: colors,
          borderColor: colors.map(c => c.replace('0.6', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // ✅ agar chart mengikuti ukuran div.chart-wrapper
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: {
              display: true,
              text: '% Tercapai'
            }
          }
        },
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }
});
