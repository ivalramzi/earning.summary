"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  groupEarnings, computeSummary, fmtUsd, fmtIdr, fmtPct, parseNum, recordTime,
} from "../lib/summary";
import {
  loadRecords, saveRecord, deleteRecord, recordExists,
  loadSettings, saveSettings, exportRecords, importRecords, loadBackupAt, saveBackupAt,
} from "../lib/storage";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const defaultName = () => {
  const d = new Date();
  return `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};
const toInput = (n) => String(n).replace(".", ",");
const PAL = ["#bcb3f3", "#d4f46a", "#f4a597", "#8fd9c9", "#8fb4f5", "#f0cf9a"];
const colorOf = (i) => PAL[i % PAL.length];
// Warna + pola (pt-0..pt-5, lihat globals.css) agar kelompok tetap terbedakan tanpa mengandalkan warna.
const pat = (i) => (i + Math.floor(i / PAL.length)) % PAL.length;
const sw = (i, extra) => ({ className: "pt-" + pat(i), style: { backgroundColor: colorOf(i), ...extra } });
const jt = (n) => (n / 1e6).toFixed(1).replace(".", ",") + " jt";

// Angka dan simbol selalu satu font (Mortane DEMO tidak punya angka).
const N = ({ children }) => <span className="num">{children}</span>;

const ICONS = {
  upload: "M12 16V4m0 0L8 8m4-4l4 4M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3",
  chevron: "M6 9l6 6 6-6",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3",
  alert: "M12 8v5m0 3h.01M10.3 4.2L2.7 18a2 2 0 001.7 3h15.2a2 2 0 001.7-3L13.7 4.2a2 2 0 00-3.4 0z",
};
const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="11" fill="#bcb3f3" />
      <rect x="8" y="17" width="4.5" height="9" rx="2.25" fill="#17171a" />
      <rect x="14.75" y="11" width="4.5" height="15" rx="2.25" fill="#17171a" />
      <rect x="21.5" y="7" width="4.5" height="19" rx="2.25" fill="#d4f46a" stroke="#17171a" strokeWidth="1.2" />
    </svg>
  );
}

function ShareBar({ rows, total }) {
  if (!total) return null;
  const pct = (r) => Math.round((r.net / total) * 100);
  return (
    <>
      <div className="share-track" role="img" aria-label={"Komposisi: " + rows.map((r) => `${r.key} ${pct(r)}%`).join(", ")}>
        {rows.map((r, i) => (
          <i key={r.key} {...sw(i, { width: `${(r.net / total) * 100}%` })} />
        ))}
      </div>
      <ul className="share-legend">
        {rows.map((r, i) => (
          <li key={r.key}><i {...sw(i)} />{r.key} <N>{pct(r)}%</N></li>
        ))}
      </ul>
    </>
  );
}

const COLS = [
  { label: "Kelompok" },
  { label: "Setelah pajak (Rp)", key: true, get: (r) => fmtIdr(r.netIdr) },
  { label: "Setelah pajak", get: (r) => fmtUsd(r.net) },
  { label: "Sebelum pajak", get: (r) => fmtUsd(r.gross) },
  { label: "Pajak", get: (r) => fmtUsd(r.tax) },
  { label: "Jumlah item", get: (r) => r.count },
];

function SummaryTable({ summary }) {
  const { rows, total } = summary;
  const cells = (r) => COLS.slice(1).map((c) => (
    <td role="cell" key={c.label} data-label={c.label} className={c.key ? "key" : undefined}><N>{c.get(r)}</N></td>
  ));
  return (
    <div className="scroll">
      <table role="table">
        <thead role="rowgroup">
          <tr role="row">
            {COLS.map((c) => (
              <th key={c.label} role="columnheader" scope="col" className={c.key ? "key" : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {rows.map((r) => (
            <tr key={r.key} role="row">
              <td role="cell" data-label="Kelompok">
                {r.key === "Lainnya" ? "Lainnya" : <><span className="pfx">Kode </span><N>{r.key}</N></>}
              </td>
              {cells(r)}
            </tr>
          ))}
        </tbody>
        <tfoot role="rowgroup">
          <tr role="row">
            <td role="cell" data-label="Kelompok">Total</td>
            {cells({ ...total, netIdr: total.netIdr })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TopList({ top, kurs, pajak }) {
  const max = Math.max(...top.map((t) => t.value));
  return (
    <div className="top">
      <h3>Item teratas</h3>
      <p className="cap">Nilai setelah pajak.</p>
      <ol>
        {top.map((t, i) => {
          const net = t.value * (1 - pajak / 100);
          return (
            <li key={i}>
              <span className="rank"><N>{i + 1}</N></span>
              <div className="top-main">
                <span className="top-title" title={t.title}>{t.title}</span>
                <span className="top-bar"><i style={{ width: `${(t.value / max) * 100}%` }} /></span>
              </div>
              <div className="top-val">
                <N>{fmtIdr(net * kurs)}</N>
                <small><N>{fmtUsd(net)}</N></small>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Compare({ records }) {
  const [sel, setSel] = useState(null);
  const data = useMemo(() => {
    const list = [...records]
      .sort((a, b) => recordTime(a.name, a.savedAt) - recordTime(b.name, b.savedAt))
      .slice(-12)
      .map((r) => ({ name: r.name, s: computeSummary({ groups: r.groups }, r.kurs, r.pajak) }));
    const codes = [...new Set(list.flatMap((d) => d.s.rows.map((x) => x.key)))].sort();
    return { list, codes, max: Math.max(...list.map((d) => d.s.total.netIdr)) };
  }, [records]);
  if (records.length < 2) return null;

  const H = 180;
  const idx = sel !== null && data.list[sel] ? sel : data.list.length - 1;
  const cur = data.list[idx];
  return (
    <div className="compare">
      <h3>Perbandingan antar jejak</h3>
      <p className="cap">Total setelah pajak, urut dari bulan terlama. Pilih batang untuk melihat rincian.</p>
      <div className="plot-wrap">
        <div className="plot" style={{ minWidth: data.list.length * 64 + 52 }}>
          <div className="plot-area" style={{ height: H }}>
            {[0, 0.5, 1].map((f) => (
              <div key={f} className="grid-line" style={{ bottom: `${f * 100}%` }}>
                <span><N>{jt(data.max * f)}</N></span>
              </div>
            ))}
            <div className="bars">
              {data.list.map((d, i) => {
                const h = Math.max(8, Math.round((d.s.total.netIdr / data.max) * H));
                return (
                  <button
                    type="button" key={d.name}
                    className={"bar" + (i === idx ? " sel" : "")}
                    aria-pressed={i === idx}
                    aria-label={`${d.name}: ${fmtIdr(d.s.total.netIdr)}`}
                    onClick={() => setSel(i)}
                  >
                    <span className="bar-col" style={{ height: h }}>
                      {d.s.rows.map((x) => {
                        const sh = Math.round((x.net / d.s.total.net) * h);
                        return (
                          <i key={x.key} {...sw(data.codes.indexOf(x.key), { height: sh })}>
                            {sh >= 18 ? <b className="seg-key">{x.key}</b> : null}
                          </i>
                        );
                      })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="names">
            {data.list.map((d) => <span key={d.name}>{d.name}</span>)}
          </div>
        </div>
      </div>
      <div className="detail" aria-live="polite">
        <b>{cur.name}</b>
        <N>{fmtIdr(cur.s.total.netIdr)}</N>
        <ul>
          {cur.s.rows.map((x) => (
            <li key={x.key}><i {...sw(data.codes.indexOf(x.key))} />{x.key} <N>{fmtIdr(x.netIdr)}</N></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function SavedItem({ rec, onLoad, onDelete }) {
  const [open, setOpen] = useState(false);
  const s = useMemo(() => computeSummary({ groups: rec.groups }, rec.kurs, rec.pajak), [rec]);
  const tgl = new Date(rec.savedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="saved-item">
      <button type="button" className="saved-head" aria-expanded={open} aria-controls={`s-${rec.id}`} onClick={() => setOpen(!open)}>
        <span className="saved-name">{rec.name}</span>
        <span className="saved-idr"><N>{fmtIdr(s.total.netIdr)}</N></span>
        <span className={"chev" + (open ? " up" : "")}><Icon name="chevron" /></span>
        <span className="saved-meta">
          <N>{fmtUsd(s.total.net)}</N> · pajak <N>{fmtPct(rec.pajak)}%</N> · kurs <N>{fmtIdr(rec.kurs)}</N> · disimpan <N>{tgl}</N>
        </span>
      </button>
      <div id={`s-${rec.id}`} className={"collapse" + (open ? " open" : "")}>
        <div className="collapse-in">
          <div className="saved-body">
            <SummaryTable summary={s} />
            {rec.top?.length ? <TopList top={rec.top} kurs={rec.kurs} pajak={rec.pajak} /> : null}
            <div className="actions">
              <button type="button" className="btn" onClick={() => onLoad(rec)}>Buka kembali</button>
              <button type="button" className="btn danger" onClick={() => onDelete(rec)}>
                <Icon name="trash" size={18} /> Hapus
              </button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

function ConfirmDialog({ ask, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (ask && !d.open) d.showModal();
    if (!ask && d.open) d.close();
  }, [ask]);
  return (
    <dialog ref={ref} className="dialog" onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {ask && (
        <div>
          <h3>{ask.title}</h3>
          <p>{ask.body}</p>
          <div className="actions end">
            <button type="button" className="btn" onClick={onClose}>Batal</button>
            <button type="button" className={"btn " + (ask.danger ? "danger solid" : "primary")} onClick={() => { ask.onYes(); onClose(); }}>
              {ask.confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

export default function Page() {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [kurs, setKurs] = useState("17494,13946");
  const [pajak, setPajak] = useState("2,66");
  const [over, setOver] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [records, setRecords] = useState([]);
  const [toast, setToast] = useState("");
  const [ask, setAsk] = useState(null);
  const [backupAt, setBackupAt] = useState(null);
  const fileRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    setRecords(loadRecords());
    setBackupAt(loadBackupAt());
    setSaveName(defaultName());
    const st = loadSettings();
    if (st && st.kurs > 0 && st.pajak >= 0) { setKurs(toInput(st.kurs)); setPajak(toInput(st.pajak)); }
  }, []);

  // Jejak yang belum masuk cadangan terakhir (disimpan setelah cadangan terakhir diunduh)
  const unbacked = records.filter((r) => !backupAt || r.savedAt > backupAt).length;

  const kursNum = parseNum(kurs);
  const pajakNum = parseNum(pajak);
  const inputsOk = kursNum > 0 && !Number.isNaN(pajakNum) && pajakNum >= 0;

  useEffect(() => {
    if (inputsOk) saveSettings({ kurs: kursNum, pajak: pajakNum });
  }, [inputsOk, kursNum, pajakNum]);

  const summary = useMemo(
    () => (parsed && inputsOk ? computeSummary(parsed, kursNum, pajakNum) : null),
    [parsed, inputsOk, kursNum, pajakNum]
  );

  function showToast(msg) {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2800);
  }

  function readFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      try { setParsed(groupEarnings(String(reader.result))); }
      catch (e) { setParsed(null); setError(e.message); }
      setLoading(false);
    };
    reader.onerror = () => { setError("File tidak bisa dibaca. Coba unggah ulang."); setLoading(false); };
    reader.readAsText(file);
  }

  async function copy() {
    if (!summary) return;
    const { total, rows } = summary;
    const text =
      `Total sebelum pajak: ${fmtUsd(total.gross)} (${fmtIdr(total.grossIdr)})\n` +
      `Pajak ${fmtPct(pajakNum)}%: ${fmtUsd(total.tax)}\n` +
      `Total setelah pajak: ${fmtUsd(total.net)} (${fmtIdr(total.netIdr)})\n\n` +
      rows.map((r) => `${r.key}: ${fmtUsd(r.net)} = ${fmtIdr(r.netIdr)}`).join("\n");
    try { await navigator.clipboard.writeText(text); showToast("Ringkasan disalin."); }
    catch { showToast("Gagal menyalin. Salin manual dari tabel."); }
  }

  function doSave(name) {
    try {
      setRecords(saveRecord({ name, kurs: kursNum, pajak: pajakNum, groups: parsed.groups, top: parsed.top }));
      showToast(`Tersimpan sebagai "${name}".`);
    } catch {
      showToast("Gagal menyimpan. Penyimpanan browser mungkin dinonaktifkan.");
    }
  }

  function save() {
    const name = saveName.trim();
    if (!name) { setNameErr("Isi nama jejak dulu."); return; }
    setNameErr("");
    if (recordExists(name)) {
      setAsk({ title: "Timpa jejak?", body: `Jejak "${name}" sudah ada. Hasil lama akan diganti.`, confirmLabel: "Timpa", onYes: () => doSave(name) });
    } else doSave(name);
  }

  function loadRecord(rec) {
    setParsed({ groups: rec.groups, skipped: 0, top: rec.top || [] });
    setKurs(toInput(rec.kurs));
    setPajak(toInput(rec.pajak));
    setFileName(`Jejak: ${rec.name}`);
    setSaveName(rec.name);
    setNameErr("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeRecord(rec) {
    setAsk({
      title: "Hapus jejak?", body: `"${rec.name}" akan dihapus permanen dari browser ini.`,
      confirmLabel: "Hapus", danger: true,
      onYes: () => { setRecords(deleteRecord(rec.id)); showToast("Jejak dihapus."); },
    });
  }

  function exportFile() {
    const blob = new Blob([exportRecords()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jejak-pendapatan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBackupAt(saveBackupAt());
    showToast("Cadangan diunduh.");
  }

  function importFile(e) {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { list, count } = importRecords(String(reader.result));
        setRecords(list);
        showToast(`${count} jejak diimpor. Nama yang sama menimpa jejak lama.`);
      } catch (err) {
        showToast(err instanceof SyntaxError ? "File bukan JSON yang valid." : err.message);
      }
    };
    reader.onerror = () => showToast("File tidak bisa dibaca.");
    reader.readAsText(file);
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#hitung"><Logo /> Ringkasan</a>
        <nav aria-label="Bagian halaman">
          <a className="pill" href="#hitung">Hitung</a>
          <a className="pill" href="#jejak">
            Jejak{unbacked > 0 && <><i className="dot" aria-hidden="true" /><span className="sr-only"> (ada yang belum dicadangkan)</span></>}
          </a>
        </nav>
      </header>

      <div className="intro">
        <h1>Pendapatan per kode, langsung dalam rupiah</h1>
        <p className="sub">
          Unggah CSV pendapatan Anda. Total per kode, pajak, dan nilai rupiah dihitung di browser,
          lalu bisa disimpan sebagai jejak bulanan.
        </p>
      </div>

      <div className="layout" id="hitung">
        <div className="side">
          <label
            className={"drop" + (over ? " over" : "")}
            onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
            onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files[0]); }}
          >
            <span className="drop-icon"><Icon name="upload" size={26} /></span>
            <b>Pilih file CSV atau seret ke sini</b>
            <span>{loading ? "Membaca file…" : fileName || "Diproses di browser Anda, tidak dikirim ke mana pun."}</span>
            <input type="file" accept=".csv,text/csv" onChange={(e) => readFile(e.target.files[0])} />
          </label>
          {error && (
            <div className="msg" role="alert"><Icon name="alert" size={18} /> {error}</div>
          )}

          <div className="opts">
            <label>
              Kurs (Rp per $1)
              <input className="num" type="text" inputMode="decimal" value={kurs} aria-describedby="hint"
                aria-invalid={!(kursNum > 0)} onChange={(e) => setKurs(e.target.value)} />
            </label>
            <label>
              Pajak (%)
              <input className="num" type="text" inputMode="decimal" value={pajak}
                aria-invalid={Number.isNaN(pajakNum) || pajakNum < 0} onChange={(e) => setPajak(e.target.value)} />
            </label>
            <p className="hint" id="hint">Desimal boleh pakai koma atau titik.</p>
          </div>
          {parsed && !inputsOk && (
            <div className="msg" role="alert">
              <Icon name="alert" size={18} /> Isi kurs dengan angka lebih dari 0 dan pajak dengan angka 0 atau lebih.
            </div>
          )}
        </div>

        <div className="results" key={summary ? "hasil" : "kosong"}>
          {summary ? (
            <>
              <div className="hero">
                <small>Total bersih setelah pajak</small>
                <div className="big num">{fmtIdr(summary.total.netIdr)}</div>
                <dl className="stats">
                  <div><dt>Setelah pajak</dt><dd><N>{fmtUsd(summary.total.net)}</N></dd></div>
                  <div><dt>Pajak <N>{fmtPct(pajakNum)}%</N></dt><dd><N>{fmtUsd(summary.total.tax)}</N></dd></div>
                  <div><dt>Sebelum pajak</dt><dd><N>{fmtUsd(summary.total.gross)}</N> · <N>{fmtIdr(summary.total.grossIdr)}</N></dd></div>
                </dl>
                <ShareBar rows={summary.rows} total={summary.total.net} />
              </div>

              <div className="save">
                <label>
                  Nama jejak
                  <input type="text" value={saveName} maxLength={60} aria-invalid={!!nameErr}
                    onChange={(e) => { setSaveName(e.target.value); setNameErr(""); }} />
                  {nameErr && <span className="field-err">{nameErr}</span>}
                </label>
                <button type="button" className="btn primary" onClick={save}>Simpan jejak</button>
                <button type="button" className="btn" onClick={copy}>Salin ringkasan</button>
              </div>

              <SummaryTable summary={summary} />
              {parsed.top?.length ? <TopList top={parsed.top} kurs={kursNum} pajak={pajakNum} /> : null}
              <p className="note">
                Kode diambil dari 3 angka di akhir judul. Judul tanpa kode masuk ke "Lainnya".
                {parsed.skipped ? ` ${parsed.skipped} baris dilewati karena nilainya bukan angka.` : ""}
              </p>
            </>
          ) : (
            <div className="empty">
              <h2>Hasil muncul di sini</h2>
              <p>Unggah file CSV untuk melihat total per kode, pajak, dan nilai rupiahnya.</p>
            </div>
          )}
        </div>
      </div>

      <section className="history" id="jejak">
        <h2>Jejak tersimpan</h2>
        {unbacked > 0 && (
          <div className="warn" role="status">
            <Icon name="alert" size={20} />
            <p>
              <b>{backupAt ? `${unbacked} jejak belum dicadangkan.` : "Jejak belum pernah dicadangkan."}</b>{" "}
              Data hanya ada di browser ini dan hilang jika data situs dihapus atau browser diganti.
            </p>
            <button type="button" className="btn primary" onClick={exportFile}>Unduh cadangan</button>
          </div>
        )}
        <Compare records={records} />
        {records.length === 0 ? (
          <p className="note">Belum ada jejak. Hitung dulu, beri nama, lalu tekan Simpan jejak.</p>
        ) : (
          <ul className="saved">
            {records.map((r) => (
              <SavedItem key={r.id} rec={r} onLoad={loadRecord} onDelete={removeRecord} />
            ))}
          </ul>
        )}
        <div className="backup">
          <button type="button" className="btn" onClick={exportFile} disabled={records.length === 0}>Unduh cadangan</button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>Impor cadangan</button>
          <input ref={fileRef} type="file" accept=".json,application/json" onChange={importFile} hidden />
        </div>
        {records.length === 0 && <p className="note">Belum ada jejak untuk dicadangkan. Impor dipakai untuk memulihkan cadangan lama.</p>}
        <p className="note">Jejak disimpan di browser ini saja. Menghapus data situs atau memakai browser lain akan menghilangkannya.</p>
      </section>

      {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
      <ConfirmDialog ask={ask} onClose={() => setAsk(null)} />
    </main>
  );
}
