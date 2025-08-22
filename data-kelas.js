window.addEventListener('DOMContentLoaded', () => {
  const kelasSelect = document.getElementById('kelasSelect');
  const waliKelasEl = document.getElementById('waliKelas');
  const table = document.getElementById('santriTable');
  const tbody = document.getElementById('santriTableBody');
  const jumlahEl = document.getElementById('jumlahSantri');

  let dataKelas = [];
  let dataSantri = [];

  // Ambil data dari backend
  window.electronAPI.mintaDataKelas();
  window.electronAPI.mintaDataSantri();

  window.electronAPI.terimaDataKelas((kelasList) => {
    dataKelas = kelasList;
    kelasList.forEach(kelas => {
      const opt = document.createElement('option');
      opt.value = kelas.nama;
      opt.textContent = kelas.nama;
      kelasSelect.appendChild(opt);
    });
  });

  window.electronAPI.terimaDataSantri((santriList) => {
    // Filter santri aktif saja
    dataSantri = santriList.filter(s => s.status === 'aktif');
  });

  kelasSelect.addEventListener('change', () => {
    const namaKelas = kelasSelect.value;
    if (!namaKelas) {
      table.style.display = 'none';
      waliKelasEl.textContent = '-';
      tbody.innerHTML = '';
      jumlahEl.textContent = '0';
      return;
    }

    // Ambil info kelas sesuai nama kelas yang dipilih
    const kelasInfo = dataKelas.find(k => k.nama === namaKelas);
    waliKelasEl.textContent = kelasInfo ? kelasInfo.wali_kelas || '-' : '-';

    // Filter santri berdasarkan kelas_utama atau kelas_extra yang sesuai
    const filteredSantri = dataSantri.filter(s =>
      s.kelas_utama === namaKelas || s.kelas_extra === namaKelas
    );

    // Pisahkan santri berdasar dapukan
    const ketuaList = [];
    const kuList = [];
    const penerobosList = [];
    const lainnyaList = [];

    filteredSantri.forEach(s => {
      if (kelasInfo) {
        if (s.nama === kelasInfo.ketua) ketuaList.push(s);
        else if (s.nama === kelasInfo.ku) kuList.push(s);
        else if (s.nama === kelasInfo.penerobos) penerobosList.push(s);
        else lainnyaList.push(s);
      } else {
        lainnyaList.push(s);
      }
    });

    // Gabungkan urutan
    const urutSantri = [...ketuaList, ...kuList, ...penerobosList, ...lainnyaList];

    tbody.innerHTML = '';

    urutSantri.forEach(s => {
      let dapukanStatus = '-';
      if (kelasInfo) {
        if (s.nama === kelasInfo.ketua) dapukanStatus = 'Ketua';
        else if (s.nama === kelasInfo.ku) dapukanStatus = 'Ku';
        else if (s.nama === kelasInfo.penerobos) dapukanStatus = 'Penerobos';
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.nama}</td>
        <td>${s.alamat || '-'}</td>
        <td>${dapukanStatus}</td>
        <td>${s.kelompok || '-'}</td>
      `;
      tbody.appendChild(tr);
    });

    table.style.display = urutSantri.length ? 'table' : 'none';
    document.getElementById('jumlahSantri').textContent = urutSantri.length;
  });
});
