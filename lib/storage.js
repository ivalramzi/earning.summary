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
export function saveRecord({ name, kurs, pajak, groups }) {
  const list = loadRecords();
  const record = {
    id: Date.now().toString(36),
    name,
    savedAt: new Date().toISOString(),
    kurs,
    pajak,
    groups,
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
