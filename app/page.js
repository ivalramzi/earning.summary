"use client";

import { useMemo, useState } from "react";
import { groupEarnings, computeSummary, fmtUsd, fmtIdr, fmtPct } from "../lib/summary";

export default function Page() {
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [kurs, setKurs] = useState("17494.13946");
  const [pajak, setPajak] = useState("2.66");
  const [over, setOver] = useState(false);
  const [copied, setCopied] = useState("");

  const kursNum = parseFloat(kurs);
  const pajakNum = parseFloat(pajak);
  const inputsOk = kursNum > 0 && !Number.isNaN(pajakNum) && pajakNum >= 0;

  const summary = useMemo(
    () => (parsed && inputsOk ? computeSummary(parsed, kursNum, pajakNum) : null),
    [parsed, inputsOk, kursNum, pajakNum]
  );

  function readFile(file) {
    if (!file) return;
    setFileName(file.name);
    setError("");
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
                    <td>{r.key}</td><td>{r.count}</td><td>{fmtUsd(r.gross)}</td>
                    <td>{fmtUsd(r.tax)}</td><td>{fmtUsd(r.net)}</td><td>{fmtIdr(r.netIdr)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Total</td><td>{summary.total.count}</td><td>{fmtUsd(summary.total.gross)}</td>
                  <td>{fmtUsd(summary.total.tax)}</td><td>{fmtUsd(summary.total.net)}</td>
                  <td>{fmtIdr(summary.total.netIdr)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <p className="note">
            Kode diambil dari 3 angka di akhir judul. Judul tanpa kode masuk ke "Lainnya".
            {parsed.skipped ? ` ${parsed.skipped} baris dilewati karena nilainya bukan angka.` : ""}
          </p>
          <button type="button" onClick={copy}>{copied || "Salin ringkasan"}</button>
        </section>
      )}
    </main>
  );
}
