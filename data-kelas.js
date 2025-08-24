document.addEventListener('DOMContentLoaded', () => {
  const kelasSelect = document.getElementById('kelasSelect');
  const waliKelasEl = document.getElementById('waliKelas');
  const table = document.getElementById('santriTable');
  const tbody = document.getElementById('santriTableBody');
  const jumlahEl = document.getElementById('jumlahSantri');

  let dataKelas = [];
  let dataSantri = [];

  // Ambil data dari backend
  Promise.all([
    fetch('/api/kelas').then(res => res.json()),
    fetch('/api/santri').then(res => res.json())
  ])
    .then(([kelasList, santriList]) => {
      dataKelas = kelasList;
      dataSantri = santriList.filter(s => s.status === 'aktif');

      kelasList.forEach(kelas => {
        const opt = document.createElement('option');
        opt.value = kelas.nama;
        opt.textContent = kelas.nama;
        kelasSelect.appendChild(opt);
      });
    })
    .catch(err => {
      console.error('Gagal memuat data:', err);
      alert('Gagal memuat data kelas atau santri.');
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

    const kelasInfo = dataKelas.find(k => k.nama === namaKelas);
    waliKelasEl.textContent = kelasInfo ? kelasInfo.wali_kelas || '-' : '-';

    const filteredSantri = dataSantri.filter(s =>
      s.kelas_utama === namaKelas || s.kelas_extra === namaKelas
    );

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
    jumlahEl.textContent = urutSantri.length;
  });
});
