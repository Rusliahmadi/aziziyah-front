document.addEventListener('DOMContentLoaded', () => {
  const filterKelompok = document.getElementById('filterKelompok');
  const tabelBody = document.querySelector('#tabelAnggota tbody');
  const wali1Span = document.getElementById('wali1');
  const wali2Span = document.getElementById('wali2');
  const detailKelompok = document.getElementById('detailKelompok');
  const jumlahAnggota = document.getElementById('jumlahAnggota');

  let semuaKelompok = [];
  let semuaSantri = [];

  // Ambil data dari API
  Promise.all([
    fetch('/api/kelompok').then(res => res.json()),
    fetch('/api/santri').then(res => res.json())
  ])
  .then(([dataKelompok, dataSantri]) => {
    semuaKelompok = dataKelompok;
    semuaSantri = dataSantri.filter(s => s.status === 'aktif');
    isiDropdownKelompok(semuaKelompok);
  })
  .catch(err => {
    console.error('Gagal mengambil data:', err);
    alert('Gagal memuat data kelompok atau santri.');
  });

  function isiDropdownKelompok(data) {
    filterKelompok.innerHTML = '<option value="">-- Pilih Kelompok --</option>'; // reset dulu
    data.forEach(k => {
      const option = document.createElement('option');
      option.value = k.nama;
      option.textContent = k.nama;
      filterKelompok.appendChild(option);
    });
  }

  filterKelompok.addEventListener('change', () => {
    const namaKelompok = filterKelompok.value;
    if (!namaKelompok) {
      detailKelompok.style.display = 'none';
      return;
    }

    const kelompok = semuaKelompok.find(k => k.nama === namaKelompok);
    if (!kelompok) {
      detailKelompok.style.display = 'none';
      return;
    }

    let anggota = semuaSantri.filter(s => s.kelompok === namaKelompok);

    // Urutkan anggota sesuai prioritas jabatan
    anggota.sort((a, b) => {
      const getRank = (s) => {
        if (s.nama === kelompok.ketua) return 1;
        if (s.nama === kelompok.ku) return 2;
        if (s.nama === kelompok.penerobos) return 3;
        return 4;
      };
      return getRank(a) - getRank(b);
    });

    // Tampilkan wali
    wali1Span.textContent = kelompok.wali1 || '-';
    wali2Span.textContent = kelompok.wali2 || '-';

    // Isi tabel anggota
    tabelBody.innerHTML = '';
    anggota.forEach(s => {
      let dapukan = 'Anggota';
      if (s.nama === kelompok.ketua) dapukan = 'Ketua';
      else if (s.nama === kelompok.ku) dapukan = 'KU';
      else if (s.nama === kelompok.penerobos) dapukan = 'Penerobos';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${s.nama}</td>
        <td>${dapukan}</td>
        <td>${s.kelas_utama || '-'}</td>
      `;
      tabelBody.appendChild(tr);
    });

    jumlahAnggota.textContent = `Jumlah: ${anggota.length} orang`;
    detailKelompok.style.display = 'block';
  });
});
