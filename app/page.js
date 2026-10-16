"use client";

import { useEffect, useMemo, useState } from "react";
import { groupEarnings, computeSummary, fmtUsd, fmtIdr, fmtPct } from "../lib/summary";
import {
  loadRecords, saveRecord, deleteRecord, recordExists,
  loadSettings, saveSettings, exportRecords, importRecords,
} from "../lib/storage";

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const defaultName = () => {
  const d = new Date();
  return `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
};

function SummaryTable({ summary }) {
  return (
    <div className="scroll">
      <table>
        <thead>
          <tr>
            <th>Kode</th><th>Item</th><th>Sebelum pajak</th><th>Pajak</th>
            <th>Setelah pajak</th><th>Setelah pajak (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {summary.rows.map((r) => (
            <tr key={r.key}>
              <td data-label="Kode">{r.key}</td><td data-label="Item">{r.count}</td><td data-label="Sebelum pajak">{fmtUsd(r.gross)}</td>
              <td data-label="Pajak">{fmtUsd(r.tax)}</td><td data-label="Setelah pajak">{fmtUsd(r.net)}</td><td data-label="Setelah pajak (Rp)">{fmtIdr(r.netIdr)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td data-label="Kode">Total</td><td data-label="Item">{summary.total.count}</td><td data-label="Sebelum pajak">{fmtUsd(summary.total.gross)}</td>
            <td data-label="Pajak">{fmtUsd(summary.total.tax)}</td><td data-label="Setelah pajak">{fmtUsd(summary.total.net)}</td>
            <td data-label="Setelah pajak (Rp)">{fmtIdr(summary.total.netIdr)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

const PALET = ["#bcb3f3", "#d4f46a", "#17171a", "#8f84ea", "#9ad0c2", "#e9b6a8"];
const jt = (n) => (n / 1e6).toFixed(2).replace(".", ",") + " jt";

function TopList({ top, kurs, pajak }) {
  return (
    <div className="top">
      <h3>10 item teratas</h3>
      <ol>
        {top.map((t, i) => (
          <li key={i}>
            <span className="top-title">{t.title}</span>
            <span>{fmtIdr(t.value * (1 - pajak / 100) * kurs)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Compare({ records }) {
  const data = useMemo(() => {
    const list = [...records]
      .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      .slice(-12)
      .map((r) => ({ name: r.name, s: computeSummary({ groups: r.groups }, r.kurs, r.pajak) }));
    const codes = [...new Set(list.flatMap((d) => d.s.rows.map((x) => x.key)))].sort();
    return { list, codes, max: Math.max(...list.map((d) => d.s.total.netIdr)) };
  }, [records]);
  if (records.length < 2) return null;
  const color = (c) => PALET[data.codes.indexOf(c) % PALET.length];
  return (
    <div className="compare">
      <h3>Perbandingan antar jejak (setelah pajak)</h3>
      <div className="bars">
        {data.list.map((d) => (
          <div className="bar" key={d.name}>
            <span className="bar-val">{jt(d.s.total.netIdr)}</span>
            <div className="bar-col" style={{ height: Math.max(6, Math.round((d.s.total.netIdr / data.max) * 200)) }}>
              {d.s.rows.map((x) => (
                <i key={x.key} style={{ flexGrow: x.net, background: color(x.key) }} title={`${x.key}: ${fmtIdr(x.netIdr)}`} />
              ))}
            </div>
            <span className="bar-name">{d.name}</span>
          </div>
        ))}
      </div>
      <ul className="legend">
        {data.codes.map((c) => (
          <li key={c}><i style={{ background: color(c) }} />{c}</li>
        ))}
      </ul>
    </div>
  );
}

function SavedItem({ rec, onLoad, onDelete }) {
  const [open, setOpen] = useState(false);
  const s = useMemo(() => computeSummary({ groups: rec.groups }, rec.kurs, rec.pajak), [rec]);
  const tgl = new Date(rec.savedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  return (
    <li className="saved-item">
      <button type="button" className="saved-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="saved-name">{rec.name}</span>
        <span className="saved-idr">{fmtIdr(s.total.netIdr)}</span>
        <span className="saved-meta">
          {fmtUsd(s.total.net)} · pajak {fmtPct(rec.pajak)}% · kurs {fmtIdr(rec.kurs)} · disimpan {tgl}
        </span>
      </button>
      {open && (
        <div className="saved-body">
          <SummaryTable summary={s} />
          {rec.top?.length ? <TopList top={rec.top} kurs={rec.kurs} pajak={rec.pajak} /> : null}
          <div className="actions">
            <button type="button" onClick={() => onLoad(rec)}>Muat ke atas</button>
            <button type="button" className="danger" onClick={() => onDelete(rec)}>Hapus</button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function Page() {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [kurs, setKurs] = useState("17494.13946");
  const [pajak, setPajak] = useState("2.66");
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState("");
  const [saveName, setSaveName] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [records, setRecords] = useState([]);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    setRecords(loadRecords());
    setSaveName(defaultName());
    const st = loadSettings();
    if (st) { setKurs(String(st.kurs)); setPajak(String(st.pajak)); }
  }, []);

  const kursNum = parseFloat(kurs);
  const pajakNum = parseFloat(pajak);
  const inputsOk = kursNum > 0 && !Number.isNaN(pajakNum) && pajakNum >= 0;

  useEffect(() => {
    if (inputsOk) saveSettings({ kurs: kursNum, pajak: pajakNum });
  }, [inputsOk, kursNum, pajakNum]);

  const summary = useMemo(
    () => (parsed && inputsOk ? computeSummary(parsed, kursNum, pajakNum) : null),
    [parsed, inputsOk, kursNum, pajakNum]
  );

  function readFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError("");
    setSaveMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      try {
        setParsed(groupEarnings(String(reader.result)));
      } catch (e) {
        setParsed(null);
        setError(e.message);
      }
    };
    reader.onerror = () => setError("File tidak bisa dibaca. Coba unggah ulang.");
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
    try {
      await navigator.clipboard.writeText(text);
      setCopied("Tersalin");
    } catch {
      setCopied("Gagal menyalin");
    }
    setTimeout(() => setCopied(""), 1800);
  }

  function save() {
    const name = saveName.trim();
    if (!name) { setSaveMsg("Isi nama jejak dulu."); return; }
    if (recordExists(name) && !window.confirm(`Jejak "${name}" sudah ada. Timpa dengan hasil ini?`)) return;
    try {
      setRecords(saveRecord({ name, kurs: kursNum, pajak: pajakNum, groups: parsed.groups, top: parsed.top }));
      setSaveMsg(`Tersimpan sebagai "${name}".`);
    } catch {
      setSaveMsg("Gagal menyimpan. Penyimpanan browser mungkin dinonaktifkan.");
    }
  }

  function loadRecord(rec) {
    setParsed({ groups: rec.groups, skipped: 0, top: rec.top || [] });
    setKurs(String(rec.kurs));
    setPajak(String(rec.pajak));
    setFileName(`Jejak: ${rec.name}`);
    setSaveName(rec.name);
    setSaveMsg("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function removeRecord(rec) {
    if (window.confirm(`Hapus jejak "${rec.name}"?`)) setRecords(deleteRecord(rec.id));
  }

function exportFile() {
    const blob = new Blob([exportRecords()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jejak-pendapatan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setBackupMsg("Cadangan diunduh.");
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
        setBackupMsg(`${count} jejak diimpor. Nama yang sama menimpa jejak lama.`);
      } catch (err) {
        setBackupMsg(err instanceof SyntaxError ? "File bukan JSON yang valid." : err.message);
      }
    };
    reader.onerror = () => setBackupMsg("File tidak bisa dibaca.");
    reader.readAsText(file);
  }

  return (
    <main>
      <h1>Ringkasan pendapatan</h1>
      <p className="sub">
        Unggah file CSV pendapatan, lalu lihat total per kode (001, 002, dst.), pajak, dan nilai rupiahnya.
      </p>

      <label
        className={"drop" + (over ? " over" : "")}
        onDragEnter={(e) => { e.preventDefault(); setOver(true); }}
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setOver(false); }}
        onDrop={(e) => { e.preventDefault(); setOver(false); readFile(e.dataTransfer.files[0]); }}
      >
        <b>Pilih file CSV atau seret ke sini</b>
        <span>{fileName || "File diproses di browser Anda dan tidak dikirim ke mana pun."}</span>
        <input type="file" accept=".csv,text/csv" onChange={(e) => readFile(e.target.files[0])} />
      </label>

      <div className="opts">
        <label>
          Kurs (Rp per $1)
          <input type="number" step="any" inputMode="decimal" value={kurs} onChange={(e) => setKurs(e.target.value)} />
        </label>
        <label>
          Pajak (%)
          <input type="number" step="any" inputMode="decimal" value={pajak} onChange={(e) => setPajak(e.target.value)} />
        </label>
      </div>

      {error && <div className="msg" role="alert">{error}</div>}
      {parsed && !inputsOk && (
        <div className="msg" role="alert">
          Isi kurs dengan angka lebih dari 0 dan pajak dengan angka 0 atau lebih.
        </div>
      )}

      {summary && (
        <section>
          <div className="hero">
            <small>Total bersih setelah pajak</small>
            <div className="big">{fmtIdr(summary.total.netIdr)}</div>
            <p>
              {fmtUsd(summary.total.net)} setelah pajak {fmtPct(pajakNum)}% · sebelum pajak{" "}
              {fmtUsd(summary.total.gross)} ({fmtIdr(summary.total.grossIdr)})
            </p>
          </div>

          <SummaryTable summary={summary} />
          {parsed.top?.length ? <TopList top={parsed.top} kurs={kursNum} pajak={pajakNum} /> : null}

          <p className="note">
            Kode diambil dari 3 angka di akhir judul. Judul tanpa kode masuk ke "Lainnya".
            {parsed.skipped ? ` ${parsed.skipped} baris dilewati karena nilainya bukan angka.` : ""}
          </p>

          <div className="save">
            <label>
              Nama jejak
              <input type="text" value={saveName} maxLength={60} onChange={(e) => setSaveName(e.target.value)} />
            </label>
            <button type="button" className="primary" onClick={save}>Simpan</button>
            <button type="button" onClick={copy}>{copied || "Salin ringkasan"}</button>
          </div>
          {saveMsg && <p className="note" role="status">{saveMsg}</p>}
        </section>
      )}

      <section className="history">
        <h2>Jejak tersimpan</h2>
        <Compare records={records} />
        {records.length === 0 ? (
          <p className="note">Belum ada jejak. Hitung dulu, beri nama, lalu tekan Simpan.</p>
        ) : (
          <ul className="saved">
            {records.map((r) => (
              <SavedItem key={r.id} rec={r} onLoad={loadRecord} onDelete={removeRecord} />
            ))}
          </ul>
        )}
        <div className="backup">
          <button type="button" onClick={exportFile} disabled={!records.length}>Unduh cadangan</button>
          <label className="btnlike">
            Impor cadangan
            <input type="file" accept=".json,application/json" onChange={importFile} hidden />
          </label>
        </div>
        {backupMsg && <p className="note" role="status">{backupMsg}</p>}
        <p className="note">Jejak disimpan di browser ini saja. Menghapus data situs atau memakai browser lain akan menghilangkannya.</p>
      </section>
    </main>
  );
}
