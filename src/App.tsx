import React, { useState, useEffect, useRef } from 'react';
import {
  downloadBatFile,
  downloadPs1File,
  MANUAL_POWERSHELL_CODE,
} from './data/scripts';

export type LogType = 'head' | 'info' | 'ok' | 'err' | 'warn';
export type FilterType = 'all' | 'err' | 'warn' | 'ok' | 'info' | 'head';

interface LogEntry {
  delay: number;
  type: LogType;
  msg: string;
}

interface DisplayedLog {
  id: number;
  time: string;
  type: LogType;
  msg: string;
}

const DEMO_LOG_SEQUENCE: LogEntry[] = [
  { delay: 300, type: 'head', msg: '╔══ SHORTCUT VIRUS REMOVER  v2.0  ══╗' },
  { delay: 600, type: 'info', msg: '▶  STEP 1 — Discovering Drives' },
  { delay: 900, type: 'ok', msg: '  ℹ  Found drives: C:\\ D:\\ E:\\' },
  { delay: 1300, type: 'info', msg: '▶  STEP 2 — Killing Suspicious Processes' },
  {
    delay: 1600,
    type: 'err',
    msg: '  ✗  REMOVED: wscript.exe (PID 4892) — C:\\Users\\User\\AppData\\Roaming\\host.vbs',
  },
  { delay: 1900, type: 'ok', msg: '  ✔  Process scan complete' },
  {
    delay: 2200,
    type: 'warn',
    msg: '  ⚠  WARNING: Suspicious script detected in C:\\Users\\User\\AppData\\Local\\Temp',
  },
  {
    delay: 2500,
    type: 'info',
    msg: '▶  STEP 3 — Removing Malicious .lnk & Autorun Files',
  },
  { delay: 2800, type: 'err', msg: '  ✗  REMOVED: E:\\autorun.inf' },
  { delay: 3100, type: 'err', msg: '  ✗  REMOVED: E:\\Documents.lnk' },
  { delay: 3400, type: 'err', msg: '  ✗  REMOVED: E:\\Music.lnk' },
  { delay: 3700, type: 'err', msg: '  ✗  REMOVED: E:\\Videos.lnk' },
  {
    delay: 4000,
    type: 'err',
    msg: '  ✗  REMOVED: C:\\Users\\User\\AppData\\Roaming\\ravmon.vbs',
  },
  { delay: 4300, type: 'ok', msg: '  ✔  File scan complete' },
  { delay: 4700, type: 'info', msg: '▶  STEP 4 — Restoring Hidden Files & Folders' },
  {
    delay: 5000,
    type: 'warn',
    msg: '  ⚠  WARNING: SystemDrive C:\\ protected — skipping full root attribute reset',
  },
  { delay: 5300, type: 'ok', msg: '  ✔  attrib -H -S /S /D on C:\\ — done' },
  { delay: 5600, type: 'ok', msg: '  ✔  attrib -H -S /S /D on D:\\ — done' },
  { delay: 5900, type: 'ok', msg: '  ✔  attrib -H -S /S /D on E:\\ — done' },
  {
    delay: 6300,
    type: 'info',
    msg: '▶  STEP 5 — Cleaning Registry Startup Entries',
  },
  {
    delay: 6700,
    type: 'err',
    msg: '  ✗  REMOVED: HKCU\\...\\Run\\HostService = ravmon.vbs',
  },
  { delay: 7000, type: 'ok', msg: '  ✔  Registry clean complete' },
  { delay: 7300, type: 'head', msg: '═══════════════════════════════════════' },
  { delay: 7600, type: 'ok', msg: '  Files Removed    : 6' },
  { delay: 7800, type: 'ok', msg: '  Drives Restored  : 3' },
  { delay: 8000, type: 'ok', msg: '  Processes Killed : 1' },
  { delay: 8200, type: 'ok', msg: '  Registry Cleaned : 1' },
  {
    delay: 8500,
    type: 'head',
    msg: '  ✨  CLEANUP COMPLETE — Please Restart Your PC',
  },
];

export const App: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Idle');
  const [filter, setFilter] = useState<FilterType>('all');
  const [logs, setLogs] = useState<DisplayedLog[]>([
    {
      id: 0,
      time: '17:41:00',
      type: 'info',
      msg: '▶ Ready. Press "Run Demo Scan" to simulate cleanup.',
    },
  ]);
  const [hasScanned, setHasScanned] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [copiedManual, setCopiedManual] = useState(false);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const manualRef = useRef<HTMLDivElement>(null);
  const timerIdsRef = useRef<number[]>([]);

  // Count log occurrences by type for the filter dropdown
  const counts = {
    all: logs.length,
    err: logs.filter((l) => l.type === 'err').length,
    warn: logs.filter((l) => l.type === 'warn').length,
    ok: logs.filter((l) => l.type === 'ok').length,
    info: logs.filter((l) => l.type === 'info').length,
    head: logs.filter((l) => l.type === 'head').length,
  };

  // Filtered log list
  const filteredLogs = logs.filter((entry) => {
    if (filter === 'all') return true;
    return entry.type === filter;
  });

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [filteredLogs]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      timerIdsRef.current.forEach((id) => clearTimeout(id));
    };
  }, []);

  const formatTimestamp = (date: Date) => {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };

  const runDemoScan = () => {
    if (scanning) return;

    // Clear any previous timers
    timerIdsRef.current.forEach((id) => clearTimeout(id));
    timerIdsRef.current = [];

    setScanning(true);
    setProgress(0);
    setStatusText('Scanning...');
    setLogs([]);

    const now = new Date();
    const total = DEMO_LOG_SEQUENCE.length;

    DEMO_LOG_SEQUENCE.forEach((entry, i) => {
      const timerId = window.setTimeout(() => {
        const pct = Math.round(((i + 1) / total) * 100);
        setProgress(pct);
        setStatusText(pct < 100 ? `${pct}% complete` : 'Done!');

        const entryTime = new Date(now.getTime() + entry.delay);
        const timeStr = formatTimestamp(entryTime);

        setLogs((prev) => [
          ...prev,
          {
            id: i + 1,
            time: timeStr,
            type: entry.type,
            msg: entry.msg,
          },
        ]);

        if (i === total - 1) {
          setScanning(false);
          setHasScanned(true);
        }
      }, entry.delay);

      timerIdsRef.current.push(timerId);
    });
  };

  const handleCopyManual = () => {
    navigator.clipboard.writeText(MANUAL_POWERSHELL_CODE).then(() => {
      setCopiedManual(true);
      setTimeout(() => setCopiedManual(false), 2000);
    });
  };

  const toggleManualInstructions = () => {
    setShowManual((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          manualRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
      return next;
    });
  };

  return (
    <>
      <div className="bg-grid"></div>
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      <div className="container">
        {/* HERO */}
        <section className="hero">
          <div className="hero-badge">
            <span className="dot"></span> Free Windows Security Tool
          </div>
          <h1>
            Shortcut Virus
            <br />
            Remover
          </h1>
          <p>
            Instantly detect and eliminate the shortcut virus from your USB drives and PC. Restore
            hidden files, clean registry, and protect your system in minutes.
          </p>
        </section>

        {/* THREAT ALERT */}
        <div className="threat-bar">
          <div className="threat-icon">⚠️</div>
          <div className="threat-text">
            <strong>Shortcut Virus Detected on Millions of PCs</strong>
            <span>
              The USB shortcut virus (Win32/Autorun) hides your files and replaces them with .lnk
              shortcuts that spread the infection to every PC they're plugged into.
            </span>
          </div>
        </div>

        {/* WHAT IS IT? */}
        <p className="section-label">What is the Shortcut Virus?</p>
        <div className="card" style={{ animation: 'fade-up 0.7s ease 0.35s both' }}>
          <div className="card-header">
            <div className="card-icon red">🦠</div>
            <div>
              <div className="card-title">Understanding the Threat</div>
              <div className="card-subtitle">USB / Removable Drive Worm</div>
            </div>
          </div>
          <div className="virus-info-grid">
            <div className="info-pill">
              <strong>How it spreads</strong>
              <span>
                Copies itself via USB drives and external storage. Runs automatically via{' '}
                <code>autorun.inf</code> when a drive is plugged in.
              </span>
            </div>
            <div className="info-pill">
              <strong>What it does</strong>
              <span>
                Hides all your folders and files using Windows Hidden/System attributes and creates
                .lnk shortcuts in their place.
              </span>
            </div>
            <div className="info-pill">
              <strong>Where it hides</strong>
              <span>
                %APPDATA%, %TEMP%, Recycle Bin folders, and adds itself to Windows registry startup keys
                to run on every boot.
              </span>
            </div>
            <div className="info-pill">
              <strong>Known variants</strong>
              <span>
                VBS/Autorun.K, Worm.VBS.Dinihou, RavMon.exe, New Folder.exe, USB Virus, Folder.exe
                worm
              </span>
            </div>
          </div>
          <div className="tags" style={{ marginTop: '16px' }}>
            <span className="tag">.lnk shortcuts</span>
            <span className="tag">autorun.inf</span>
            <span className="tag">hidden files</span>
            <span className="tag">registry persistence</span>
            <span className="tag">VBS worm</span>
            <span className="tag">USB spreading</span>
          </div>
        </div>

        {/* SCAN DEMO */}
        <p className="section-label">Live Scanner Demo</p>
        <div className="scan-demo" id="scanDemo">
          <div className="scan-demo-header">
            <div className="scan-header-left">
              <div className="dots">
                <div className="dot d-red"></div>
                <div className="dot d-yellow"></div>
                <div className="dot d-green"></div>
              </div>
              <span>ShortcutVirusRemover — PowerShell Engine v2.0</span>
            </div>

            <div className="scan-filter-wrapper">
              <label htmlFor="logFilter" className="scan-filter-label">
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                <span>Filter:</span>
              </label>
              <select
                id="logFilter"
                className="scan-filter-select"
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                aria-label="Filter scan logs"
              >
                <option value="all">All Logs ({counts.all})</option>
                <option value="err">Errors & Threats ({counts.err})</option>
                <option value="warn">Warnings ({counts.warn})</option>
                <option value="ok">Success ({counts.ok})</option>
                <option value="info">Info & Steps ({counts.info})</option>
                <option value="head">Headers ({counts.head})</option>
              </select>
            </div>
          </div>

          <div className="scan-demo-body" id="scanLog" ref={logContainerRef}>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((entry) => (
                <div
                  key={entry.id}
                  className={`log-line ${entry.type}`}
                  style={{ animationDelay: '0s' }}
                >
                  <span className="ts">{entry.time}</span>
                  <span className="msg">{entry.msg}</span>
                </div>
              ))
            ) : (
              <div className="empty-filter-notice">
                <span>No logs match the "{filter.toUpperCase()}" filter.</span>
                <button
                  type="button"
                  className="empty-filter-reset"
                  onClick={() => setFilter('all')}
                >
                  Show All Logs ({counts.all})
                </button>
              </div>
            )}
          </div>

          <div className="scan-controls">
            <button
              className="scan-btn"
              id="scanBtn"
              onClick={runDemoScan}
              disabled={scanning}
            >
              {scanning ? '⏳ Scanning...' : hasScanned ? '▶ Run Again' : '▶ Run Demo Scan'}
            </button>
            <div className="progress-bar">
              <div
                className="progress-fill"
                id="progressFill"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <span className="scan-status" id="scanStatus">
              {statusText}
            </span>
          </div>
        </div>

        {/* HOW TO USE */}
        <p className="section-label" style={{ marginTop: '32px' }}>
          How to Use
        </p>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <div className="step-content">
              <h3>Download the Tool</h3>
              <p>
                Click the download button below to get <code>ShortcutVirusRemover.bat</code> and{' '}
                <code>engine.ps1</code>. Save them to the same folder (e.g., your Desktop).
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">2</div>
            <div className="step-content">
              <h3>Plug in Your USB Drive (if affected)</h3>
              <p>
                Before running the tool, insert any USB drives that may be infected so they get
                scanned automatically.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">3</div>
            <div className="step-content">
              <h3>Right-click → Run as Administrator</h3>
              <p>
                Right-click <code>ShortcutVirusRemover.bat</code> and select{' '}
                <strong>"Run as administrator"</strong>. The tool auto-requests elevation, but
                explicit admin ensures full access.
              </p>
              <span className="step-code">Right-click → Run as administrator</span>
            </div>
          </div>
          <div className="step">
            <div className="step-num">4</div>
            <div className="step-content">
              <h3>Wait for Cleanup to Finish</h3>
              <p>
                The tool will scan all drives, kill malicious processes, remove virus files, restore
                your hidden files, and clean registry entries. This takes 30–120 seconds.
              </p>
            </div>
          </div>
          <div className="step">
            <div className="step-num">5</div>
            <div className="step-content">
              <h3>Restart Your PC</h3>
              <p>
                After cleanup completes, restart your computer to finalize all changes. Check your
                Desktop for the <code>ShortcutVirusRemover_Report.txt</code> log file.
              </p>
            </div>
          </div>
        </div>

        {/* FEATURES */}
        <p className="section-label" style={{ marginTop: '32px' }}>
          What It Fixes
        </p>
        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-emoji">🔗</span>
            <h4>Removes Malicious .lnk Files</h4>
            <p>Deletes all shortcut files planted by the virus on drive roots and in folders.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🚫</span>
            <h4>Cleans autorun.inf</h4>
            <p>
              Removes autorun.inf files that cause the virus to auto-execute when drives are plugged in.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">👁</span>
            <h4>Restores Hidden Files</h4>
            <p>
              Uses <code>attrib -H -S</code> to make your hidden files and folders visible again.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">💀</span>
            <h4>Kills Malicious Processes</h4>
            <p>Terminates wscript.exe and cscript.exe instances running from Temp/AppData folders.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🗝️</span>
            <h4>Registry Cleanup</h4>
            <p>Removes virus entries from Windows startup registry keys (Run / RunOnce).</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">📋</span>
            <h4>Full Cleanup Report</h4>
            <p>Saves a detailed timestamped log of every action taken to your Desktop.</p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🔍</span>
            <h4>Scans All Connected Drives</h4>
            <p>
              Automatically discovers and scans every drive letter — C:, D:, USB drives — without
              configuration.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">⚡</span>
            <h4>One-Click Operation</h4>
            <p>
              No installation required. Double-click, approve UAC, and the tool does everything
              automatically.
            </p>
          </div>
          <div className="feature-card">
            <span className="feature-emoji">🔎</span>
            <h4>Deep Scan Mode</h4>
            <p>
              Safely inspects desktop.ini and shortcuts across all folders, deleting only those
              containing virus scripts.
            </p>
          </div>
        </div>

        {/* DOWNLOAD */}
        <div className="download-section" style={{ marginTop: '32px' }}>
          <h2>🛡️ Clean Your PC Now</h2>
          <p>Free, open-source, no installation required. Works on Windows 7, 8, 10, and 11.</p>
          <div className="btn-group">
            <button
              className="btn btn-accent"
              id="downloadBat"
              onClick={downloadBatFile}
              title="Download the one-click .BAT launcher"
            >
              ⬇ Download .BAT Launcher
            </button>
            <button
              className="btn btn-primary"
              id="downloadPs1"
              onClick={downloadPs1File}
              title="Download PowerShell cleanup engine"
            >
              ⬇ Download engine.ps1
            </button>
            <button
              className="btn btn-secondary"
              onClick={toggleManualInstructions}
              title="View manual PowerShell commands"
            >
              📋 Manual Instructions
            </button>
          </div>
          <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--text-dim)' }}>
            ✓ No internet required after download &nbsp;·&nbsp; ✓ Open source &nbsp;·&nbsp; ✓ No data
            collected
          </p>
        </div>

        {/* MANUAL INSTRUCTIONS (hidden by default) */}
        {showManual && (
          <div id="manualSection" ref={manualRef} style={{ marginTop: '20px' }}>
            <div className="card">
              <div className="card-header">
                <div className="card-icon yellow">📋</div>
                <div>
                  <div className="card-title">Manual PowerShell Instructions</div>
                  <div className="card-subtitle">
                    Run this in PowerShell as Administrator if you prefer
                  </div>
                </div>
              </div>
              <pre
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '12px',
                  background: 'var(--surface3)',
                  border: '1px solid var(--border2)',
                  borderRadius: '8px',
                  padding: '16px',
                  color: 'var(--accent)',
                  overflowX: 'auto',
                  lineHeight: 1.8,
                }}
              >
                <span style={{ color: 'var(--text-dim)' }}>
                  # Run in PowerShell as Administrator:
                </span>
                <br />
                <span style={{ color: 'var(--primary2)' }}>Set-ExecutionPolicy</span> Bypass -Scope
                Process -Force
                <br />
                <span style={{ color: 'var(--text-dim)' }}>
                  # Remove autorun.inf from all drives
                </span>
                <br />
                <span style={{ color: 'var(--primary2)' }}>Get-PSDrive</span> -PSProvider FileSystem |{' '}
                <span style={{ color: 'var(--primary2)' }}>ForEach-Object</span> &#123;
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span style={{ color: 'var(--primary2)' }}>Remove-Item</span> "$($_.Root)autorun.inf"
                -Force -ErrorAction SilentlyContinue
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;
                <span style={{ color: 'var(--primary2)' }}>Get-ChildItem</span> $_.Root -Filter
                "*.lnk" -Force |{' '}
                <span style={{ color: 'var(--primary2)' }}>Where-Object</span> &#123; $_.Name -notmatch
                '(?i)desktop\.ini' &#125; |{' '}
                <span style={{ color: 'var(--primary2)' }}>Remove-Item</span> -Force
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;if ($_.Root -ne "$env:SystemDrive\\") &#123;
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span style={{ color: 'var(--primary2)' }}>cmd</span> /c "attrib -H -S /S /D
                `"$($_.Root)*`""
                <br />
                &nbsp;&nbsp;&nbsp;&nbsp;&#125;
                <br />
                &#125;
                <br />
                <span style={{ color: 'var(--text-dim)' }}>
                  # Kill suspicious wscript from Temp
                </span>
                <br />
                <span style={{ color: 'var(--primary2)' }}>Get-Process</span> wscript,cscript
                -ErrorAction SilentlyContinue |{' '}
                <span style={{ color: 'var(--primary2)' }}>Where-Object</span> &#123; $_.Path -match
                'Temp|AppData' &#125; |{' '}
                <span style={{ color: 'var(--primary2)' }}>Stop-Process</span> -Force
              </pre>
              <button
                className="btn btn-secondary"
                style={{ marginTop: '14px', fontSize: '13px' }}
                onClick={handleCopyManual}
              >
                {copiedManual ? '✔ Copied!' : '📋 Copy to Clipboard'}
              </button>
            </div>
          </div>
        )}

        {/* DISCLAIMER & TROUBLESHOOTING */}
        <div className="disclaimer" style={{ marginTop: '20px' }}>
          <strong>⚠ Important:</strong> This tool requires Administrator privileges to function
          correctly. It modifies file attributes and registry keys — always verify what actions are
          being taken by reviewing the script before running. While this tool is designed to be
          safe, using reputable antivirus software alongside it is always recommended.
        </div>
        <div
          className="disclaimer"
          style={{
            marginTop: '12px',
            background: 'rgba(59,130,246,0.06)',
            borderColor: 'rgba(59,130,246,0.2)',
          }}
        >
          <strong style={{ color: 'var(--primary2)' }}>
            ℹ️ Troubleshooting "These files can't be opened":
          </strong>{' '}
          If Windows Security blocks the downloaded <code>.bat</code> or <code>.ps1</code> file,
          it's because it was downloaded from the internet.
          <br />
          <br />
          <strong>Fix:</strong> Right-click the downloaded file ➔ Select <strong>Properties</strong>{' '}
          ➔ Check the <strong>Unblock</strong> box at the bottom of the General tab ➔ Click{' '}
          <strong>Apply</strong> and try running it again.
        </div>

        {/* FOOTER */}
        <div className="footer">
          <p>Shortcut Virus Remover &copy; 2026 &nbsp;·&nbsp; Open Source &nbsp;·&nbsp; Windows 7/8/10/11</p>
          <p style={{ marginTop: '6px' }}>
            Made with ❤️ to help fight the most common USB malware on Windows
          </p>
          <p style={{ marginTop: '6px', color: 'var(--text-dim)' }}>
            Developed &amp; Maintained by -{' '}
            <a
              href="https://fardinjim.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--primary2)', textDecoration: 'none', fontWeight: 500 }}
            >
              FJ
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default App;
