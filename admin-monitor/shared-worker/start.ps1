$ErrorActionPreference = 'Stop'
$configDir = 'C:\ProgramData\KampungCetak\SharedAssistant'
$mutex = New-Object Threading.Mutex($false, 'Local\KampungCetakSharedAssistant')
$owned = $false
try {
    try { $owned = $mutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owned = $true }
    if (-not $owned) { exit 0 }
    while ($true) {
        try {
            $config = Get-Content -LiteralPath (Join-Path $configDir 'settings.json') -Raw | ConvertFrom-Json
            $env:OWNER_CHAT_CONFIG_DIR = $configDir
            $worker = Start-Process -FilePath $config.nodePath -ArgumentList ('"' + $config.workerPath + '"') -WorkingDirectory $configDir -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $configDir 'worker.log') -RedirectStandardError (Join-Path $configDir 'worker-error.log')
            while (-not $worker.WaitForExit(10000)) {
                $health = Join-Path $configDir 'health.json'
                if ((Test-Path -LiteralPath $health) -and (([DateTime]::UtcNow - (Get-Item -LiteralPath $health).LastWriteTimeUtc).TotalMinutes -gt 3)) {
                    & "$env:SystemRoot\System32\taskkill.exe" /PID $worker.Id /T /F | Out-Null
                    break
                }
            }
        } catch { }
        Start-Sleep -Seconds 5
    }
} finally {
    if ($owned) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
