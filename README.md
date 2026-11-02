# Shortcut Virus Remover (React Edition)

A modern, high-performance React application for **Shortcut Virus Remover** — a free security tool and educational platform to detect and eliminate the shortcut virus (Win32/Autorun worm) from Windows PCs and USB drives.

---

## ⚡ Features & Capabilities

- **Interactive Live Scan Demo Simulator**: Real-time animated terminal simulating all 5 steps of the PowerShell cleanup engine with timestamps, status indicator, and dynamic progress bar.
- **Direct Download Engine**: Instant browser download of `ShortcutVirusRemover.bat` launcher and `engine.ps1` PowerShell script.
- **Interactive Threat Breakdown**: Detailed explanation of the worm's propagation methods, hidden file attribution, registry startup persistence, and known variants.
- **Step-by-Step Guide**: Visual 5-step workflow with copyable administrator execution commands.
- **Fixes & Remediation Matrix**: Comprehensive breakdown of malicious `.lnk` removal, `autorun.inf` neutralization, file attribute restoration (`attrib -H -S`), and process termination.
- **Manual PowerShell Remediation**: Expandable syntax-highlighted PowerShell script with one-click clipboard copying.
- **Troubleshooting Guide**: Built-in instructions for resolving Windows Security SmartScreen download blocks.

---

## 📁 Project Structure

```text
├── index.html                   # HTML entry point with metadata & web fonts
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & scripts
├── tsconfig.json                # TypeScript configuration
├── vite.config.ts               # Vite server & bundler configuration
├── public/
│   ├── ShortcutVirusRemover.bat # Batch launcher script
│   └── engine.ps1               # PowerShell cleanup engine
└── src/
    ├── main.tsx                 # React DOM mount point
    ├── App.tsx                  # Main application component & scan simulator
    ├── index.css                # Cybersecurity theme styling & animations
    └── data/
        └── scripts.ts           # Script payloads, manual code & download utilities
```

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start Vite dev server on port 3000
npm run dev

# Typecheck and build for production
npm run build

# Preview production build
npm run preview
```

---

## 🛡️ License

MIT License — free to use, modify, and distribute.
