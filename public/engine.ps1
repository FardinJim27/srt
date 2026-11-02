function Test-Administrator {  
    $user = [Security.Principal.WindowsIdentity]::GetCurrent()
    (New-Object Security.Principal.WindowsPrincipal $user).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)  
}

if (-not (Test-Administrator)) {
    Write-Host "Restarting script with Administrative privileges..."
    Start-Process powershell.exe -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

function Clean-PC {
    Write-Host "`n--- Cleaning PC ---" -ForegroundColor Cyan
    # 1. Kill wscript.exe
    Write-Host "Killing wscript.exe and other suspicious processes..."
    Get-Process wscript, cscript -ErrorAction SilentlyContinue | Stop-Process -Force
    
    # 2. Fix Registry
    Write-Host "Restoring Registry Policies (Task Manager, Hidden Files)..."
    $regPaths = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\System",
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer"
    )
    foreach ($path in $regPaths) {
        if (Test-Path $path) {
            Remove-ItemProperty -Path $path -Name "DisableTaskMgr" -ErrorAction SilentlyContinue
            Remove-ItemProperty -Path $path -Name "DisableRegistryTools" -ErrorAction SilentlyContinue
        }
    }
    
    # Restore hidden file visibility
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "Hidden" -Value 1 -ErrorAction SilentlyContinue
    Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Advanced" -Name "ShowSuperHidden" -Value 1 -ErrorAction SilentlyContinue
    
    # 3. Clean Startup
    Write-Host "Scanning Startup folders..."
    $startupPaths = @(
        "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup",
        "$env:ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
    )
    foreach ($path in $startupPaths) {
        if (Test-Path $path) {
            $badFiles = Get-ChildItem -Path $path -Include *.vbs, *.vbe, *.js, *.wsf, *.ini -Recurse -Force
            foreach ($file in $badFiles) {
                Write-Host "Removing malicious startup file: $($file.Name)" -ForegroundColor Yellow
                Remove-Item -LiteralPath $file.FullName -Force
            }
        }
    }
    
    # 4. Clean Run Keys
    Write-Host "Scanning Registry Run Keys..."
    $runKeys = @(
        "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run",
        "HKLM:\Software\Microsoft\Windows\CurrentVersion\Run"
    )
    foreach ($key in $runKeys) {
        if (Test-Path $key) {
            $entries = Get-ItemProperty -Path $key
            foreach ($prop in $entries.psobject.properties) {
                if ($prop.Value -match '\.vbs|\.js|\.wsf|wscript') {
                    Write-Host "Removing malicious Run key: $($prop.Name)" -ForegroundColor Yellow
                    
                    # Try to extract file path and delete the payload from Drive C:
                    $val = $prop.Value
                    $filePath = $null
                    if ($val -match '([a-zA-Z]:\\[^\"]+\.(?:vbs|js|wsf|vbe|bat|cmd|exe))') {
                        $filePath = $matches[1]
                    }
                    elseif ($val -match '"([^"]+\.(?:vbs|js|wsf|vbe|bat|cmd|exe))"') {
                        $filePath = $matches[1]
                    }
                    
                    if ($filePath -and (Test-Path $filePath)) {
                        Write-Host "Removing malicious payload file: $filePath" -ForegroundColor Yellow
                        Remove-Item -LiteralPath $filePath -Force -ErrorAction SilentlyContinue
                    }

                    Remove-ItemProperty -Path $key -Name $prop.Name -Force
                }
            }
        }
    }
    Write-Host "PC Cleanup Complete!" -ForegroundColor Green
}

function Clean-Drive {
    param([string]$DriveLetter)
    
    $drive = "$($DriveLetter):\"
    if (-not (Test-Path $drive)) {
        Write-Host "Drive $drive not found!" -ForegroundColor Red
        return
    }
    
    $isSystemDrive = ($drive -eq "$env:SystemDrive\")
    
    Write-Host "`n--- Cleaning Drive $drive ---" -ForegroundColor Cyan
    Write-Host "Step 1: Removing hidden attributes..."
    
    if ($isSystemDrive) {
        Write-Host "System drive detected. Skipping recursive attribute reset to protect OS files." -ForegroundColor Yellow
    }
    else {
        attrib -h -r -s /s /d "$drive\*.*"
    }
    
    Write-Host "Step 2: Deleting malicious files..."
    $badExtensions = @("*.vbs", "*.lnk", "*.ini", "*.wsf")
    foreach ($ext in $badExtensions) {
        Get-ChildItem -Path $drive -Filter $ext -Force | ForEach-Object {
            # DO NOT delete desktop.ini if it's the system drive
            if ($isSystemDrive -and $_.Name -match "(?i)desktop\.ini") {
                return
            }
            Write-Host "Removed $($_.Name)" -ForegroundColor Yellow
            Remove-Item -LiteralPath $_.FullName -Force
        }
    }
    
    $virusExe = Join-Path $drive "USB Disk.exe"
    if (Test-Path $virusExe) {
        Remove-Item -Path $virusExe -Force
        Write-Host "Removed USB Disk.exe" -ForegroundColor Yellow
    }
    
    Write-Host "Step 3: Moving files out of hidden nameless folders..."
    $root = [System.IO.DirectoryInfo]$drive
    $dirs = $root.GetDirectories() | Where-Object { $_.Name -ne 'System Volume Information' -and $_.Name -notmatch '[a-zA-Z0-9]' }
    
    foreach ($d in $dirs) { 
        Write-Host "Restoring contents from hidden folder '$($d.Name)'"
        $d.GetFiles() | ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination $drive -Force }
        $d.GetDirectories() | ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination $drive -Force }
        Remove-Item -LiteralPath $d.FullName -Force -Recurse -ErrorAction SilentlyContinue
    }
    
    Write-Host "Drive $drive Cleanup Complete!" -ForegroundColor Green
}

function Clean-DeepScan {
    param([string]$DriveLetter)
    
    $drive = "$($DriveLetter):\"
    if (-not (Test-Path $drive)) {
        Write-Host "Drive $drive not found!" -ForegroundColor Red
        return
    }
    
    Write-Host "`n--- Deep Scanning Drive $drive ---" -ForegroundColor Cyan
    Write-Host "Safely inspecting all folders for malicious desktop.ini and .lnk shortcuts."
    Write-Host "This may take a while depending on drive size..." -ForegroundColor Yellow
    
    $sh = New-Object -ComObject WScript.Shell
    
    Get-ChildItem -Path $drive -Include *.lnk, desktop.ini -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object {
        $file = $_
        try {
            if ($file.Extension -eq '.lnk') {
                $lnk = $sh.CreateShortcut($file.FullName)
                # If shortcut launches a script or command prompt, it's likely malicious
                if ($lnk.TargetPath -match '(?i)wscript\.exe|cscript\.exe|cmd\.exe|\.vbs|\.wsf|\.vbe|\.js') {
                    Write-Host "Removing malicious shortcut: $($file.FullName)" -ForegroundColor Red
                    Remove-Item -LiteralPath $file.FullName -Force
                }
            }
            elseif ($file.Name -match '(?i)desktop\.ini') {
                # Read content to check for malicious script triggers
                $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
                if ($content -match '(?i)wscript|cscript|\.vbs|\.wsf|\.vbe|\.js') {
                    Write-Host "Removing infected desktop.ini: $($file.FullName)" -ForegroundColor Red
                    Remove-Item -LiteralPath $file.FullName -Force
                }
            }
        } catch {
            # Skip if access denied or locked
        }
    }
    
    Write-Host "Deep Scan Complete!" -ForegroundColor Green
}

while ($true) {
    Clear-Host
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "    SHORTCUT VIRUS REMOVER V2.0       " -ForegroundColor Yellow
    Write-Host "======================================" -ForegroundColor Cyan
    Write-Host "1. Clean Local PC (Registry, Startup, Processes)"
    Write-Host "2. Clean a USB Drive"
    Write-Host "3. Clean Both (PC + USB)"
    Write-Host "4. Deep Scan a Drive (Recursively inspect desktop.ini & shortcuts)"
    Write-Host "5. Exit"
    Write-Host "======================================" -ForegroundColor Cyan
    
    $choice = Read-Host "Select an option (1-5)"
    
    switch ($choice) {
        "1" {
            Clean-PC
            Read-Host "`nPress Enter to return to menu"
        }
        "2" {
            $d = Read-Host "Enter the drive letter to clean (e.g., G)"
            if ($d -match '^[a-zA-Z]$') {
                Clean-Drive -DriveLetter $d
            }
            else {
                Write-Host "Invalid drive letter." -ForegroundColor Red
            }
            Read-Host "`nPress Enter to return to menu"
        }
        "3" {
            Clean-PC
            $d = Read-Host "`nEnter the USB drive letter to clean (e.g., G)"
            if ($d -match '^[a-zA-Z]$') {
                Clean-Drive -DriveLetter $d
            }
            else {
                Write-Host "Invalid drive letter." -ForegroundColor Red
            }
            Read-Host "`nPress Enter to return to menu"
        }
        "4" {
            $d = Read-Host "`nEnter the drive letter to deep scan (e.g., C or G)"
            if ($d -match '^[a-zA-Z]$') {
                Clean-DeepScan -DriveLetter $d
            }
            else {
                Write-Host "Invalid drive letter." -ForegroundColor Red
            }
            Read-Host "`nPress Enter to return to menu"
        }
        "5" {
            exit
        }
        default {
            Write-Host "Invalid option." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
}
