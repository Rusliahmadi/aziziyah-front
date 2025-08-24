window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const santriId = urlParams.get('id');

  const namaEl = document.getElementById('namaSantri');
  const alamatEl = document.getElementById('alamatSantri');
  const tglMasukEl = document.getElementById('tglMasuk');
  const riwayatKelasEl = document.getElementById('riwayatKelas');
  const tabelRaportEl = document.getElementById('tabelRaport');
  const rekapAbsenEl = document.getElementById('rekapAbsen');
  const totalProgresEl = document.getElementById('totalProgres');
  const persenKehadiranEl = document.getElementById('persenKehadiran');

  if (!santriId) {
    namaEl.textContent = 'ID santri tidak ditemukan.';
    return;
  }

  let raportList = [];
  let materiList = [];

  // Request data santri dari main process Electron
  window.electronAPI.mintaDataSantri();
  window.electronAPI.terimaDataSantri((list) => {
    const santri = list.find(s => s.id == santriId);
    if (!santri) {
      namaEl.textContent = 'Santri tidak ditemukan.';
      return;
    }
    // Isi data dasar santri
    namaEl.textContent = santri.nama;
    alamatEl.textContent = santri.alamat || '-';
    tglMasukEl.textContent = santri.tgl_masuk || '-';

    // Request data absensi, raport, dan materi
    window.electronAPI.mintaDataAbsenSantri(santri.nama);
    window.electronAPI.mintaDataRaportSantri(santri.id);
    window.electronAPI.mintaDataMateri();
  });

  // Terima dan proses data absensi
  window.electronAPI.terimaDataAbsenSantri((absenList) => {
    const rekap = { hadir: 0, izin: 0, sakit: 0, alpa: 0 };
    absenList.forEach(item => {
      if (rekap[item.status] !== undefined) rekap[item.status]++;
    });
    rekapAbsenEl.innerHTML = `
      <tr>
        <td>${rekap.hadir}</td>
        <td>${rekap.izin}</td>
        <td>${rekap.sakit}</td>
        <td>${rekap.alpa}</td>
      </tr>`;
    const total = rekap.hadir + rekap.izin + rekap.sakit + rekap.alpa;
    persenKehadiranEl.textContent = `Persentase Kehadiran = ${
      total ? ((rekap.hadir / total) * 100).toFixed(2) : '0.00'
    }%`;
  });

  // Terima data materi
  window.electronAPI.terimaDataMateri((materi) => {
    materiList = materi;
    renderTabelRaport();
  });

  // Terima data raport santri
  window.electronAPI.terimaDataRaportSantri((raport) => {
    raportList = raport;
    renderTabelRaport();
  });

  // Dapatkan kelas awal dari raport santri (untuk jalur materi)
  function getKelasAwalDariRaport() {
    const urutan = ['BacaPegon','SMP 1','SMP 2','SMP 3','Lambatan','Cepatan','Saringan'];
    const found = raportList.map(r => r.kelas);
    for (let k of urutan) if (found.includes(k)) return k;
    return '';
  }

  // Tentukan jalur kelas berdasarkan kelas awal
  function getJalurKelas(kelasAwal) {
    if (kelasAwal === 'BacaPegon') return ['BacaPegon','Lambatan','Cepatan'];
    if (kelasAwal === 'SMP 1') return ['SMP 1','SMP 2','SMP 3','Cepatan'];
    return [];
  }

  // Render tabel raport santri berdasarkan materi dan raport yang sudah diterima
  function renderTabelRaport() {
    if (!raportList.length || !materiList.length) return;

    // Buat map untuk akses cepat raport per kelas & materi
    const raportMap = {};
    // Untuk riwayat kelas masuk dan lulus
    const kelasMap = {};

    raportList.forEach(r => {
      const key = `${r.kelas}||${r.materi}`;
      raportMap[key] = r;
      // Track tanggal masuk dan lulus tiap kelas, ambil earliest masuk & latest lulus
      if (!kelasMap[r.kelas]) {
        kelasMap[r.kelas] = { masuk: r.masuk_tanggal, lulus: r.lulus_tanggal };
      } else {
        kelasMap[r.kelas].masuk = r.masuk_tanggal < kelasMap[r.kelas].masuk ? r.masuk_tanggal : kelasMap[r.kelas].masuk;
        kelasMap[r.kelas].lulus = r.lulus_tanggal > (kelasMap[r.kelas].lulus||'') ? r.lulus_tanggal : kelasMap[r.kelas].lulus;
      }
    });

    const kelasAwal = getKelasAwalDariRaport();
    const jalurKelas = getJalurKelas(kelasAwal);

    // Urutan kelas yang dipakai untuk sorting
    const urutanKelas = ['BacaPegon','Lambatan','SMP 1','SMP 2','SMP 3','Cepatan','Saringan'];

    // Filter materi sesuai jalur kelas santri
    const filtered = materiList.filter(m => jalurKelas.includes(m.kelas));

    filtered.sort((a,b) => {
      const d = urutanKelas.indexOf(a.kelas) - urutanKelas.indexOf(b.kelas);
      return d !== 0 ? d : a.materi.localeCompare(b.materi);
    });

    tabelRaportEl.innerHTML = '';
    if (!filtered.length) {
      tabelRaportEl.innerHTML = '<tr><td colspan="4">Tidak ada materi yang sesuai jalur kelas.</td></tr>';
      totalProgresEl.textContent = 'Total Progres = 0%';
      return;
    }

    let totalPersen = 0;
    filtered.forEach(m => {
      const key = `${m.kelas}||${m.materi}`;
      const r = raportMap[key];
      const persen = r?.persen ?? 0;
      const halaman = r?.halaman ?? '-';
      const ket = r ? (persen >= 100 ? 'Khatam' : `${persen}%`) : '0%';

      const row = document.createElement('tr');
      row.innerHTML = `<td>${m.kelas}</td><td>${m.materi}</td><td>${halaman}</td><td>${ket}</td>`;
      tabelRaportEl.appendChild(row);
      totalPersen += persen;
    });

    totalProgresEl.textContent = `Total Progres = ${(filtered.length ? (totalPersen / filtered.length).toFixed(2) : '0.00')}%`;

    // Tampilkan riwayat kelas
    riwayatKelasEl.innerHTML = '';
    urutanKelas.forEach(k => {
      if (kelasMap[k]) {
        const { masuk, lulus } = kelasMap[k];
        const p = document.createElement('p');
        p.textContent = `Kelas ${k}: ${masuk} s/d ${lulus || '-'}`;
        riwayatKelasEl.appendChild(p);
      }
    });
  }
});
