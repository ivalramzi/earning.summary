// Parser CSV sederhana (mendukung tanda kutip) dan perhitungan ringkasan.

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== "")) rows.push(row);
  return rows;
}

// Mengelompokkan pendapatan berdasarkan 3 angka di akhir judul (001, 002, ...).
export function groupEarnings(csvText) {
  const rows = parseCSV(csvText.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("File kosong atau bukan CSV yang valid.");

  const head = rows[0].map((x) => x.trim().toLowerCase());
  const ti = head.findIndex((x) => x === "title" || x === "judul");
  let ei = head.findIndex((x) => x.includes("total earnings"));
  if (ei < 0) ei = head.findIndex((x) => x.includes("earning") && !x.includes("change"));
  if (ti < 0 || ei < 0)
    throw new Error('Kolom "Title" dan "Total Earnings ($USD)" tidak ditemukan di file ini.');

  const groups = {};
  const items = [];
  let skipped = 0;
  for (const r of rows.slice(1)) {
    const v = parseFloat((r[ei] || "").replace(/[^0-9.\-]/g, ""));
    if (Number.isNaN(v)) { skipped++; continue; }
    const m = (r[ti] || "").trim().match(/(\d{3})\s*$/);
    const key = m ? m[1] : "Lainnya";
    groups[key] = groups[key] || { count: 0, sum: 0 };
    groups[key].count++;
    groups[key].sum += v;
    items.push({ title: (r[ti] || "").trim(), value: v });
  }
  items.sort((a, b) => b.value - a.value);
  return { groups, skipped, top: items.slice(0, 10) };
}

export function computeSummary({ groups }, kurs, pajakPersen) {
  const p = pajakPersen / 100;
  const keys = Object.keys(groups).sort((a, b) =>
    a === "Lainnya" ? 1 : b === "Lainnya" ? -1 : a.localeCompare(b)
  );
  const rows = keys.map((k) => {
    const { count, sum } = groups[k];
    const tax = sum * p;
    const net = sum - tax;
    return { key: k, count, gross: sum, tax, net, netIdr: net * kurs };
  });
  const gross = rows.reduce((a, r) => a + r.gross, 0);
  const tax = gross * p;
  const net = gross - tax;
  return {
    rows,
    total: {
      count: rows.reduce((a, r) => a + r.count, 0),
      gross, tax, net,
      grossIdr: gross * kurs,
      netIdr: net * kurs,
    },
  };
}

const nf = (n, d) =>
  new Intl.NumberFormat("id-ID", { minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
export const fmtUsd = (n) => "$" + nf(n, 2);
export const fmtIdr = (n) => "Rp " + nf(Math.round(n), 0);
export const fmtPct = (n) => nf(n, 2);
