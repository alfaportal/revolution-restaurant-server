const fs = require("fs");
const os = require("os");
const path = require("path");
const net = require("net");
const http = require("http");
const https = require("https");
const { execFile, execSync } = require("child_process");

const ROOT = __dirname;
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "config.json"), "utf8"));

function need(name) {
  const v = String(cfg[name] || "").trim();
  if (!v) {
    console.log("Print failed: mungon " + name + " te config.json");
    process.exit(1);
  }
  return v;
}

const serverUrl = need("serverUrl").replace(/\/+$/, "");
const slug = need("slug");
const apiKey = need("apiKey");
const deviceId = need("deviceId");
const pollInterval = Math.max(1000, Number(cfg.pollInterval) || 2000);

function request(method, urlStr, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === "https:" ? https : http;
    const data = body ? JSON.stringify(body) : null;
    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port || undefined,
        path: url.pathname + url.search,
        method,
        headers: data
          ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) }
          : {},
        timeout: 15000,
      },
      (res) => {
        let raw = "";
        res.on("data", (c) => { raw += c; });
        res.on("end", () => {
          let json = null;
          try { json = raw ? JSON.parse(raw) : null; } catch { json = null; }
          resolve({ status: Number(res.statusCode) || 0, json });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("serveri nuk u përgjigj"));
    });
    req.on("error", reject);
    if (data) req.write(data);
    req.end();
  });
}

function pollUrl() {
  return serverUrl
    + "/api/arka/" + encodeURIComponent(slug)
    + "/print/poll/" + encodeURIComponent(deviceId)
    + "?key=" + encodeURIComponent(apiKey);
}

function statusUrl() {
  return serverUrl
    + "/api/arka/" + encodeURIComponent(slug)
    + "/print/status?key=" + encodeURIComponent(apiKey);
}

function chunkPlan(len) {
  if (len > 16384) return { chunkSize: 128, delayMs: 20 };
  if (len > 4096) return { chunkSize: 192, delayMs: 15 };
  if (len > 1500) return { chunkSize: 256, delayMs: 10 };
  return { chunkSize: 512, delayMs: 6 };
}

function printSpooler(buffer, printerName) {
  const binPath = path.join(os.tmpdir(), `arka-escpos-${Date.now()}-${process.pid}.bin`);
  const psPath = path.join(os.tmpdir(), `arka-escpos-${Date.now()}-${process.pid}.ps1`);
  const plan = chunkPlan(buffer.length);
  const ps = [
    "param([string]$PrinterName, [string]$BinPath, [int]$ChunkSize = 512, [int]$DelayMs = 8)",
    "$bytes = [System.IO.File]::ReadAllBytes($BinPath)",
    "Add-Type -TypeDefinition @'",
    "using System;",
    "using System.Runtime.InteropServices;",
    "public class RawPrint {",
    "  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)]",
    "  public class DOCINFO { public string pDocName; public string pOutputFile; public string pDataType; }",
    "  [DllImport(\"winspool.drv\", CharSet=CharSet.Unicode)] public static extern bool OpenPrinter(string p, out IntPtr h, IntPtr d);",
    "  [DllImport(\"winspool.drv\")] public static extern bool ClosePrinter(IntPtr h);",
    "  [DllImport(\"winspool.drv\", CharSet=CharSet.Unicode)] public static extern bool StartDocPrinter(IntPtr h, int lvl, [In] DOCINFO di);",
    "  [DllImport(\"winspool.drv\")] public static extern bool EndDocPrinter(IntPtr h);",
    "  [DllImport(\"winspool.drv\")] public static extern bool StartPagePrinter(IntPtr h);",
    "  [DllImport(\"winspool.drv\")] public static extern bool EndPagePrinter(IntPtr h);",
    "  [DllImport(\"winspool.drv\")] public static extern bool WritePrinter(IntPtr h, IntPtr buf, int cb, out int written);",
    "}",
    "'@",
    "$di = New-Object RawPrint+DOCINFO",
    "$di.pDocName = 'Receipt'",
    "$di.pDataType = 'RAW'",
    "$h = [IntPtr]::Zero",
    "if (-not [RawPrint]::OpenPrinter($PrinterName, [ref]$h, [IntPtr]::Zero)) { throw \"OpenPrinter failed: $PrinterName\" }",
    "try {",
    "  if (-not [RawPrint]::StartDocPrinter($h, 1, $di)) { throw 'StartDocPrinter failed' }",
    "  try {",
    "    if (-not [RawPrint]::StartPagePrinter($h)) { throw 'StartPagePrinter failed' }",
    "    try {",
    "      $offset = 0",
    "      while ($offset -lt $bytes.Length) {",
    "        $len = [Math]::Min($ChunkSize, $bytes.Length - $offset)",
    "        $p = [Runtime.InteropServices.Marshal]::AllocHGlobal($len)",
    "        try {",
    "          [Runtime.InteropServices.Marshal]::Copy($bytes, $offset, $p, $len)",
    "          $written = 0",
    "          if (-not [RawPrint]::WritePrinter($h, $p, $len, [ref]$written)) { throw \"WritePrinter failed at offset $offset\" }",
    "          if ($written -le 0) { throw \"WritePrinter wrote 0 at offset $offset\" }",
    "          $offset += $written",
    "        } finally { [Runtime.InteropServices.Marshal]::FreeHGlobal($p) }",
    "        if ($DelayMs -gt 0 -and $offset -lt $bytes.Length) { Start-Sleep -Milliseconds $DelayMs }",
    "      }",
    "    } finally { [void][RawPrint]::EndPagePrinter($h) }",
    "  } finally { [void][RawPrint]::EndDocPrinter($h) }",
    "} finally { [void][RawPrint]::ClosePrinter($h) }",
  ].join("\r\n");
  fs.writeFileSync(binPath, buffer);
  fs.writeFileSync(psPath, ps, "utf8");
  const safeName = String(printerName).replace(/"/g, "");
  return new Promise((resolve, reject) => {
    execFile(
      "powershell",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", psPath, "-PrinterName", safeName, "-BinPath", binPath, "-ChunkSize", String(plan.chunkSize), "-DelayMs", String(plan.delayMs)],
      { timeout: 60000, windowsHide: true },
      (err, stdout, stderr) => {
        try { fs.unlinkSync(binPath); } catch { /* */ }
        try { fs.unlinkSync(psPath); } catch { /* */ }
        const text = `${stdout || ""}\n${stderr || ""}`;
        if (err) return reject(new Error((err.message || text).slice(0, 300)));
        if (/OpenPrinter failed|WritePrinter failed/i.test(text)) return reject(new Error(text.trim().slice(0, 300)));
        resolve();
      },
    );
  });
}

function printTcp(buffer, printerPort) {
  const raw = String(printerPort || "").trim();
  let host = raw;
  let port = 9100;
  const m = raw.match(/^(.+):(\d+)$/);
  if (m && !/^com\d+$/i.test(raw)) {
    host = m[1];
    port = Number(m[2]) || 9100;
  }
  const plan = chunkPlan(buffer.length);
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let offset = 0;
    let settled = false;
    const fail = (err) => {
      if (settled) return;
      settled = true;
      try { socket.destroy(); } catch { /* */ }
      reject(err instanceof Error ? err : new Error(String(err)));
    };
    const writeNext = () => {
      if (offset >= buffer.length) {
        socket.end();
        return;
      }
      const end = Math.min(offset + plan.chunkSize, buffer.length);
      socket.write(buffer.subarray(offset, end), (err) => {
        if (err) return fail(err);
        offset = end;
        if (offset < buffer.length && plan.delayMs > 0) setTimeout(writeNext, plan.delayMs);
        else writeNext();
      });
    };
    socket.setTimeout(25000);
    socket.once("error", fail);
    socket.once("timeout", () => fail(new Error("TCP timeout " + host + ":" + port)));
    socket.connect(port, host, () => writeNext());
    socket.once("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });
  });
}

function printCom(buffer, printerPort) {
  const port = String(printerPort || "").trim().replace(/:$/, "");
  if (!/^com\d+$/i.test(port)) throw new Error("Porta COM është e gabuar");
  try {
    execSync(`mode ${port}: BAUD=19200 PARITY=N DATA=8 STOP=1`, { timeout: 10000, stdio: "pipe" });
  } catch {
    try {
      execSync(`mode ${port}: BAUD=9600 PARITY=N DATA=8 STOP=1`, { timeout: 10000, stdio: "pipe" });
    } catch { /* */ }
  }
  const fd = fs.openSync(`\\\\.\\${port}`, "w");
  try {
    let offset = 0;
    while (offset < buffer.length) {
      const n = fs.writeSync(fd, buffer, offset, Math.min(512, buffer.length - offset));
      if (!n) throw new Error("COM u bllokua");
      offset += n;
    }
  } finally {
    try { fs.closeSync(fd); } catch { /* */ }
  }
}

async function sendToPrinter(buffer) {
  const errors = [];
  const name = String(cfg.printerName || "").trim();
  const port = String(cfg.printerPort || "").trim();
  if (name) {
    try {
      await printSpooler(buffer, name);
      return;
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (port && !/^com\d+$/i.test(port)) {
    try {
      await printTcp(buffer, port);
      return;
    } catch (e) {
      errors.push(e.message);
    }
  }
  if (/^com\d+$/i.test(port)) {
    try {
      printCom(buffer, port);
      return;
    } catch (e) {
      errors.push(e.message);
    }
  }
  throw new Error(errors.join(" | ") || "Mungon emri ose porta e printerit");
}

async function report(id, status) {
  await request("POST", statusUrl(), { id, status });
}

let busy = false;

async function tick() {
  if (busy) return;
  busy = true;
  try {
    console.log("Polling...");
    const res = await request("GET", pollUrl());
    const jobs = res.json && Array.isArray(res.json.jobs) ? res.json.jobs : [];
    for (const job of jobs) {
      console.log("Job received: " + job.id);
      try {
        const bytes = Buffer.from(String(job.receipt_data || ""), "base64");
        if (!bytes.length) throw new Error("kuponi është bosh");
        await sendToPrinter(bytes);
        await report(job.id, "printed");
        console.log("Printed OK");
      } catch (e) {
        const msg = e.message || "gabim";
        console.log("Print failed: " + msg);
        try { await report(job.id, "failed"); } catch { /* */ }
      }
    }
  } catch (e) {
    console.log("Print failed: " + (e.message || "nuk u lidh me serverin"));
  } finally {
    busy = false;
  }
}

console.log("Bridge gati — nis me: node bridge.js");
tick();
setInterval(tick, pollInterval);
