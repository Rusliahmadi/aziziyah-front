document.addEventListener('DOMContentLoaded', () => {
  const isInputPage = !!document.getElementById('formRaport');
  const isViewPage = !!document.getElementById('filterNama');

  if (isInputPage) initInputPage();
  else if (isViewPage) initViewPage();
  else console.error('Halaman raport tidak dikenali');
});

let dataSantri = [];
let dataMateri = [];
let dataRaport = [];

function formatToInputDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// === HALAMAN INPUT ===
function initInputPage() {
  const namaSantri = document.getElementById('namaSantri');
  const kelasSantri = document.getElementById('kelasSantri');
  const materiKelas = document.getElementById('materiKelas');
  const tanggalMasuk = document.getElementById('tanggalMasuk');
  const halamanDicapai = document.getElementById('halamanDicapai');
  const persenCapaian = document.getElementById('persenCapaian');
  const tanggalLulus = document.getElementById('tanggalLulus');
  const form = document.getElementById('formRaport');

  let halamanCheckboxContainer = document.getElementById('halamanCheckboxContainer');
  if (!halamanCheckboxContainer) {
    halamanCheckboxContainer = document.createElement('div');
    halamanCheckboxContainer.id = 'halamanCheckboxContainer';
    halamanCheckboxContainer.style.margin = '8px 0 12px 0';
    halamanDicapai.parentNode.insertBefore(halamanCheckboxContainer, persenCapaian);
  }

  function parseNomorHalamanRange(nomorHalamanStr) {
    if (!nomorHalamanStr) return { start: 1, end: 1 };
    const parts = nomorHalamanStr.split('-').map(x => parseInt(x.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return { start: parts[0], end: parts[1] };
    }
    return { start: 1, end: 1 };
  }

  function generateHalamanCheckboxRange(startPage, endPage, selectedHalaman = []) {
    halamanCheckboxContainer.innerHTML = '';
    for (let i = startPage; i <= endPage; i++) {
      const label = document.createElement('label');
      label.style.marginRight = '8px';
      label.style.userSelect = 'none';

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.value = i;
      if (selectedHalaman.includes(i)) cb.checked = true;
      cb.addEventListener('change', updateHalamanInputFromCheckbox);

      label.appendChild(cb);
      label.append(` ${i} `);
      halamanCheckboxContainer.appendChild(label);
    }
  }

  function parseHalamanToArray(halamanStr) {
    const selected = [];
    if (!halamanStr) return selected;
    const parts = halamanStr.split(',');
    parts.forEach(p => {
      const [a, b] = p.split('-').map(x => parseInt(x.trim()));
      if (!isNaN(a)) {
        if (isNaN(b)) selected.push(a);
        else for (let i = a; i <= b; i++) selected.push(i);
      }
    });
    return selected;
  }

  function updateHalamanInputFromCheckbox() {
    const checkedPages = [...halamanCheckboxContainer.querySelectorAll('input[type="checkbox"]:checked')]
      .map(cb => parseInt(cb.value))
      .sort((a, b) => a - b);

    const ranges = [];
    let start = null, prev = null;

    checkedPages.forEach(page => {
      if (start === null) {
        start = page;
        prev = page;
      } else if (page === prev + 1) {
        prev = page;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = page;
        prev = page;
      }
    });

    if (start !== null) {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    }

    halamanDicapai.value = ranges.join(',');
    updatePersen();
  }

  function updateCheckboxFromHalamanInput() {
    const inp = halamanDicapai.value.trim();
    const selected = parseHalamanToArray(inp);

    const allCheckboxes = halamanCheckboxContainer.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
      cb.checked = selected.includes(parseInt(cb.value));
    });

    updatePersen();
  }

  function hitungPersen(inp, startPage, endPage) {
    if (!inp || !startPage || !endPage) return NaN;
    let count = 0;
    const parts = inp.split(',');
    for (let p of parts) {
      const [a, b] = p.split('-').map(x => parseInt(x));
      if (isNaN(a)) continue;

      const lower = Math.max(a, startPage);
      const upper = b ? Math.min(b, endPage) : a;
      if (upper >= lower) count += (upper - lower + 1);
    }
    const total = endPage - startPage + 1;
    return Math.min(100, Math.round((count / total) * 100));
  }

  function updatePersen() {
    const selectedMateri = dataMateri.find(m => m.materi === materiKelas.value && m.kelas === kelasSantri.value);
    if (!selectedMateri) return persenCapaian.value = '';
    const { start, end } = parseNomorHalamanRange(selectedMateri.nomor_halaman);
    const persen = hitungPersen(halamanDicapai.value, start, end);
    persenCapaian.value = isNaN(persen) ? 'Format salah' : (persen === 100 ? 'Khatam' : `${persen}%`);
  }

  function updateMateriOptions(kelasTerpilih) {
    materiKelas.innerHTML = `<option value="">–Pilih Materi–</option>`;
    if (!kelasTerpilih) {
      halamanCheckboxContainer.innerHTML = '';
      halamanDicapai.value = '';
      persenCapaian.value = '';
      return;
    }
    const filtered = dataMateri.filter(m => m.kelas === kelasTerpilih);
    filtered.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.materi;
      opt.textContent = `${m.materi} (${m.nomor_halaman || '-'})`;
      materiKelas.appendChild(opt);
    });
  }

  kelasSantri.addEventListener('change', () => {
    const kelasTerpilih = kelasSantri.value;
    if (!kelasTerpilih) {
      namaSantri.innerHTML = `<option value="">–Pilih Nama–</option>`;
      materiKelas.innerHTML = `<option value="">–Pilih Materi–</option>`;
      halamanCheckboxContainer.innerHTML = '';
      halamanDicapai.value = '';
      persenCapaian.value = '';
      return;
    }

    const santriFilter = dataSantri.filter(s => s.kelas_utama === kelasTerpilih);
    namaSantri.innerHTML = `<option value="">–Pilih Nama–</option>`;
    santriFilter.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.nama;
      namaSantri.appendChild(opt);
    });

    updateMateriOptions(kelasTerpilih);
    halamanCheckboxContainer.innerHTML = '';
    halamanDicapai.value = '';
    persenCapaian.value = '';
  });

  namaSantri.addEventListener('change', () => {
    tanggalMasuk.value = '';
    tanggalMasuk.readOnly = false;
    halamanCheckboxContainer.innerHTML = '';
    halamanDicapai.value = '';
    persenCapaian.value = '';

    const selectedSantri = dataSantri.find(s => s.id == namaSantri.value);
    const kelasTerpilih = kelasSantri.value;
    if (!selectedSantri || !kelasTerpilih) return;

    const found = dataRaport.find(r => r.santri_id === selectedSantri.id && r.kelas === kelasTerpilih);
    if (found && found.masuk_tanggal) {
      tanggalMasuk.value = formatToInputDate(found.masuk_tanggal);
      tanggalMasuk.readOnly = true;
    }
  });

  materiKelas.addEventListener('change', () => {
    const kelasTerpilih = kelasSantri.value;
    const selectedMateri = dataMateri.find(m => m.materi === materiKelas.value && m.kelas === kelasTerpilih);
    if (!selectedMateri) {
      halamanCheckboxContainer.innerHTML = '';
      halamanDicapai.value = '';
      persenCapaian.value = '';
      return;
    }
    const { start, end } = parseNomorHalamanRange(selectedMateri.nomor_halaman);
    generateHalamanCheckboxRange(start, end);

    const selectedSantri = dataSantri.find(s => s.id == namaSantri.value);
    if (!selectedSantri || !kelasTerpilih) return;

    const found = dataRaport.find(r =>
      r.santri_id === selectedSantri.id &&
      r.kelas === kelasTerpilih &&
      r.materi === materiKelas.value
    );

    if (found && found.halaman) {
      halamanDicapai.value = found.halaman;
      const selectedPages = parseHalamanToArray(found.halaman);
      generateHalamanCheckboxRange(start, end, selectedPages);
      updatePersen();
      tanggalLulus.value = found.lulus_tanggal ? formatToInputDate(found.lulus_tanggal) : '';
    } else {
      halamanDicapai.value = '';
      persenCapaian.value = '';
      tanggalLulus.value = '';
    }
  });

  halamanDicapai.addEventListener('input', updateCheckboxFromHalamanInput);

  // === Data Load ===
  fetch('data/santri.json').then(res => res.json()).then(santri => {
    dataSantri = santri;
    const kelasUnik = [...new Set(dataSantri.map(s => s.kelas_utama).filter(k => k))].sort();
    kelasSantri.innerHTML = `<option value="">–Pilih Kelas–</option>`;
    kelasUnik.forEach(kelas => {
      const opt = document.createElement('option');
      opt.value = kelas;
      opt.textContent = kelas;
      kelasSantri.appendChild(opt);
    });
    namaSantri.innerHTML = `<option value="">–Pilih Nama–</option>`;
  });

  fetch('data/materi.json').then(res => res.json()).then(materi => {
    dataMateri = materi;
    if (kelasSantri.value) updateMateriOptions(kelasSantri.value);
  });

  fetch('data/raport.json').then(res => res.json()).then(raport => {
    dataRaport = raport;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!namaSantri.value || !materiKelas.value || !tanggalMasuk.value || !halamanDicapai.value) {
      return alert('Mohon lengkapi semua field wajib.');
    }

    const selectedMateri = dataMateri.find(m => m.materi === materiKelas.value && m.kelas === kelasSantri.value);
    if (!selectedMateri) return alert('Materi tidak ditemukan.');

    const { start, end } = parseNomorHalamanRange(selectedMateri.nomor_halaman);
    const persen = hitungPersen(halamanDicapai.value.trim(), start, end);

    const data = {
      santri_id: parseInt(namaSantri.value),
      kelas: kelasSantri.value,
      materi: materiKelas.value,
      masuk_tanggal: tanggalMasuk.value,
      halaman: halamanDicapai.value.trim(),
      persen: Math.min(100, persen),
      lulus_tanggal: tanggalLulus.value || null
    };

    // Simpan ke localStorage
    let existing = JSON.parse(localStorage.getItem('raportData') || '[]');
    existing = existing.filter(r =>
      !(r.santri_id === data.santri_id && r.kelas === data.kelas && r.materi === data.materi)
    );
    existing.push(data);
    localStorage.setItem('raportData', JSON.stringify(existing));

    alert('✅ Raport berhasil disimpan.');
    form.reset();
    persenCapaian.value = '';
    tanggalMasuk.readOnly = false;
    halamanCheckboxContainer.innerHTML = '';
  });

  document.getElementById('btn-kembali')?.addEventListener('click', () => {
    sessionStorage.removeItem('formRaport');
    window.location.href = 'data-santri.html';
  });
}

