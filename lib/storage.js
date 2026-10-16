// Penyimpanan jejak perhitungan di localStorage (hanya di browser ini).
const KEY = "ringkasan-pendapatan:jejak";

export function loadRecords() {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persist(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
  return list;
}

// Menyimpan jejak. Nama yang sama menimpa jejak lama.
export function saveRecord({ name, kurs, pajak, groups, top }) {
  const list = loadRecords();
  const record = {
    id: Date.now().toString(36),
    name,
    savedAt: new Date().toISOString(),
    kurs,
    pajak,
    groups,
    top,
  };
  const i = list.findIndex((r) => r.name.toLowerCase() === name.toLowerCase());
  if (i >= 0) list[i] = record;
  else list.unshift(record);
  return persist(list);
}

export function deleteRecord(id) {
  return persist(loadRecords().filter((r) => r.id !== id));
}

export function recordExists(name) {
  return loadRecords().some((r) => r.name.toLowerCase() === name.toLowerCase());
}

// Kurs & pajak terakhir
const SKEY = "ringkasan-pendapatan:pengaturan";
export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch { return null; }
}
export function saveSettings(s) {
  try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch {}
}

// Waktu cadangan terakhir diunduh (untuk pengingat)
const BKEY = "ringkasan-pendapatan:cadangan";
export function loadBackupAt() {
  try { return localStorage.getItem(BKEY) || null; } catch { return null; }
}
export function saveBackupAt() {
  const t = new Date().toISOString();
  try { localStorage.setItem(BKEY, t); } catch {}
  return t;
}

// Cadangan: ekspor & impor semua jejak sebagai JSON
export function exportRecords() {
  return JSON.stringify({ versi: 1, jejak: loadRecords() }, null, 2);
}

export function importRecords(text) {
  const data = JSON.parse(text);
  const incoming = Array.isArray(data) ? data : data.jejak;
  if (!Array.isArray(incoming)) throw new Error("Format cadangan tidak dikenali.");
  const ok = (g) => g && typeof g === "object" &&
    Object.values(g).every((x) => x && Number.isFinite(x.count) && Number.isFinite(x.sum));
  const valid = incoming.filter(
    (r) => r && typeof r.name === "string" && r.kurs > 0 && r.pajak >= 0 && ok(r.groups)
  );
  if (!valid.length) throw new Error("Tidak ada jejak yang valid di file ini.");
  const list = loadRecords();
  for (const r of valid) {
    const rec = {
      id: r.id || Date.now().toString(36),
      name: r.name,
      savedAt: r.savedAt || new Date().toISOString(),
      kurs: r.kurs, pajak: r.pajak, groups: r.groups, top: r.top,
    };
    const i = list.findIndex((x) => x.name.toLowerCase() === rec.name.toLowerCase());
    if (i >= 0) list[i] = rec; else list.push(rec);
  }
  list.sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  persist(list);
  return { list, count: valid.length };
}
