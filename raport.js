async function initViewPage() {
  const filterKelasUtama = document.getElementById('filterKelasUtama');
  const filterNama = document.getElementById('filterNama');
  const filterKelas = document.getElementById('filterKelas');
  const hasil = document.getElementById('hasil');
  const tanggalMasukField = document.getElementById('tanggalMasuk');
  const tanggalLulusField = document.getElementById('tanggalLulus');

  let dataSantri = [];
  let dataMateri = [];
  let dataRaport = [];

  // Fungsi bantu isi dropdown nama santri
  function tampilkanNamaSantri(santriList) {
    filterNama.innerHTML = `<option value=""> Pilih Nama </option>`;
    santriList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.nama;
      filterNama.appendChild(opt);
    });

    // Reset form lainnya
    filterNama.value = '';
    filterKelas.innerHTML = `<option value=""> Pilih Kelas </option>`;
    filterKelas.disabled = true;
    tanggalMasukField.value = '';
    tanggalLulusField.value = '';
    hasil.innerHTML = '';
  }

  // Fungsi fetch data dari backend API
  async function fetchData(endpoint) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) throw new Error(`Error fetching ${endpoint}: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil data dari server.');
      return [];
    }
  }

  // Ambil semua data secara parallel
  [dataSantri, dataMateri, dataRaport] = await Promise.all([
    fetchData('/api/santri'),
    fetchData('/api/materi'),
    fetchData('/api/raport'),
  ]);

  // Isi filter kelas utama
  const kelasUtamaSet = new Set(dataSantri.map(s => s.kelas_utama).filter(Boolean));
  filterKelasUtama.innerHTML = `<option value=""> Pilih Kelas </option>`;
  kelasUtamaSet.forEach(kls => {
    const opt = document.createElement('option');
    opt.value = kls;
    opt.textContent = kls;
    filterKelasUtama.appendChild(opt);
  });

  // Isi nama santri awal (semua)
  tampilkanNamaSantri(dataSantri);

  // Event handler kelas utama dipilih
  filterKelasUtama.addEventListener('change', () => {
    const selectedKelasUtama = filterKelasUtama.value;
    const santriTersaring = selectedKelasUtama
      ? dataSantri.filter(s => s.kelas_utama === selectedKelasUtama)
      : dataSantri;

    tampilkanNamaSantri(santriTersaring);
  });

  // Event handler nama santri dipilih
  filterNama.addEventListener('change', () => {
    const idSantri = filterNama.value;
    filterKelas.innerHTML = `<option value=""> Pilih Kelas </option>`;
    filterKelas.disabled = true;
    tanggalMasukField.value = '';
    tanggalLulusField.value = '';
    hasil.innerHTML = '';

    if (!idSantri) return;

    const kelasSet = new Set();
    dataRaport.forEach(r => {
      if (r.santri_id == idSantri) kelasSet.add(r.kelas);
    });

    if (kelasSet.size > 0) {
      kelasSet.forEach(kls => {
        const opt = document.createElement('option');
        opt.value = kls;
        opt.textContent = kls;
        filterKelas.appendChild(opt);
      });
      filterKelas.disabled = false;
    }
  });

  // Event handler kelas dipilih
  filterKelas.addEventListener('change', () => {
    hasil.innerHTML = '';
    tanggalMasukField.value = '';
    tanggalLulusField.value = '';

    const idSantri = parseInt(filterNama.value);
    const namaKelas = filterKelas.value;
    if (!idSantri || !namaKelas) return;

    const materiUntukKelas = dataMateri.filter(m => m.kelas === namaKelas);

    if (materiUntukKelas.length === 0) {
      hasil.textContent = 'Belum ada materi untuk kelas ini.';
      return;
    }

    const raportSantriKelas = dataRaport.filter(r => r.santri_id === idSantri && r.kelas === namaKelas);

    const foundMasuk = raportSantriKelas.find(r => r.masuk_tanggal);
    tanggalMasukField.value = foundMasuk?.masuk_tanggal || '';

    const foundLulus = raportSantriKelas.find(r => r.lulus_tanggal);
    tanggalLulusField.value = foundLulus?.lulus_tanggal || '';

    const table = document.createElement('table');
    table.border = '1';
    table.cellPadding = '6';
    table.style.borderCollapse = 'collapse';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Materi</th>
        <th>Halaman</th>
        <th>Persen</th>
      </tr>
    `;
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    let totalHalaman = 0;
    let totalTercapai = 0;

    materiUntukKelas.forEach(materi => {
      const raportItem = raportSantriKelas.find(r => r.materi === materi.materi);

      const nomorHalamanRange = materi.nomor_halaman ? `(${materi.nomor_halaman})` : '';
      const [start, end] = materi.nomor_halaman?.split('-').map(n => parseInt(n)) || [0, 0];
      const totalHal = end - start + 1;

      let halaman = '';
      let persen = '';

      if (raportItem) {
        halaman = raportItem.halaman || '';

        const halamanTercapai = new Set();
        if (raportItem.halaman) {
          raportItem.halaman.split(',').forEach(part => {
            const [a, b] = part.split('-').map(n => parseInt(n.trim()));
            if (!isNaN(a)) {
              if (!isNaN(b)) {
                for (let i = a; i <= b; i++) {
                  if (i >= start && i <= end) halamanTercapai.add(i);
                }
              } else {
                if (a >= start && a <= end) halamanTercapai.add(a);
              }
            }
          });
        }

        const tercapai = halamanTercapai.size;
        totalHalaman += totalHal;
        totalTercapai += tercapai;

        persen = raportItem.persen >= 100 ? 'Khatam' : (raportItem.persen || '') + '%';
      } else {
        totalHalaman += totalHal;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${materi.materi} ${nomorHalamanRange}</td>
        <td>${halaman}</td>
        <td>${persen}</td>
      `;
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    hasil.appendChild(table);

    const capaianDiv = document.createElement('div');
    capaianDiv.style.marginTop = '12px';
    const persenKeseluruhan = totalHalaman ? Math.round((totalTercapai / totalHalaman) * 100) : 0;
    capaianDiv.innerHTML = `<strong>Tercapai: </strong>${persenKeseluruhan}%`;
    hasil.appendChild(capaianDiv);
  });
}
