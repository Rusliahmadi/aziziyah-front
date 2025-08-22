document.addEventListener('DOMContentLoaded', () => {
  const tabelJurnal = document.querySelector('#tabel-jurnal tbody');
  const theadJurnal = document.querySelector('#tabel-jurnal thead');

  theadJurnal.innerHTML = `
    <tr>
      <th>Kelas</th>
      <th>Jenis Materi</th>
      <th>Materi</th>
      <th>Halaman</th>
      <th>Ayat</th>
      <th>Target</th>
    </tr>
  `;

  window.electronAPI.mintaDataJurnal();

  window.electronAPI.terimaDataJurnal((dataList) => {
    if (!Array.isArray(dataList)) {
      console.warn('Data jurnal tidak valid:', dataList);
      tabelJurnal.innerHTML = `<tr><td colspan="6">Data jurnal tidak valid.</td></tr>`;
      return;
    }

    function ambilJenisMateri(materiNama) {
      if (!materiNama) return '';
      const parts = materiNama.split(' - ');
      return parts[0].trim();
    }

    function ambilNamaMateri(materiNama) {
      if (!materiNama) return '';
      const parts = materiNama.split(' - ');
      return parts[1] ? parts[1].trim() : '';
    }

    const grouped = {};

    dataList.forEach(item => {
      if (!item.kelas || !item.materi_nama || !item.tanggal) return;

      const jenis = ambilJenisMateri(item.materi_nama);
      const nama = ambilNamaMateri(item.materi_nama);
      const key = `${item.kelas}||${jenis}`;
      const tanggalItem = new Date(item.tanggal);

      if (!grouped[key] || tanggalItem > new Date(grouped[key].tanggal)) {
        grouped[key] = {
          ...item,
          jenis_materi: jenis,
          nama_materi: nama
        };
      }
    });

    // Ubah ke array dan sort by kelas
    const sortedList = Object.values(grouped).sort((a, b) => {
      return a.kelas.localeCompare(b.kelas);
    });

    tabelJurnal.innerHTML = '';

    sortedList.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.kelas}</td>
        <td>${item.jenis_materi}</td>
        <td>${item.nama_materi}</td>
        <td>${item.hal || '-'}</td>
        <td>${item.ayat || '-'}</td>
        <td>${item.target !== undefined ? item.target : '-'}</td>
      `;
      tabelJurnal.appendChild(tr);
    });

    if (tabelJurnal.innerHTML.trim() === '') {
      tabelJurnal.innerHTML = `<tr><td colspan="6">Tidak ada data untuk ditampilkan.</td></tr>`;
    }
  });
});
