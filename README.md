# Shortcut Virus Remover

**A free, open-source Windows tool to detect and remove the Shortcut Virus from your PC and USB drives.**

---

## 📁 Files

| File | Description |
|------|-------------|
| `index.html` | Beautiful web GUI with live scan demo, features, and instructions |
| `ShortcutVirusRemover.bat` | Double-click launcher — auto-requests Admin rights |
| `engine.ps1` | PowerShell cleanup engine |

---

## 🚀 Quick Start

1. **Double-click `ShortcutVirusRemover.bat`**
2. Click **Yes** on the UAC (Admin) prompt
3. Wait for the scan to complete (~1–2 minutes)
4. **Restart your PC**
5. Check `Desktop\ShortcutVirusRemover_Report.txt` for the full log

> Or open `index.html` in any browser for the full visual guide.

---

## 🛡️ What It Does

- ✅ Removes `.lnk` shortcut files from drive roots
- ✅ Deletes `autorun.inf` files from all drives
- ✅ Kills `wscript.exe` / `cscript.exe` running from Temp/AppData
- ✅ Restores hidden files and folders (`attrib -H -S /S /D`)
- ✅ Cleans malicious entries from Windows registry `Run` keys
- ✅ Scans startup folders for rogue `.vbs` / `.vbe` scripts
- ✅ Saves a full timestamped report to your Desktop

---

## ⚙️ Requirements

- Windows 7, 8, 10, or 11
- PowerShell 5.0+ (built into all modern Windows)
- Administrator privileges

---

## ⚠️ Disclaimer

This tool modifies file system attributes and registry keys. Always review scripts before running them. Use alongside a reputable antivirus for best results. No liability is assumed for any data loss.

---

## 📄 License

MIT License — free to use, modify, and distribute.
