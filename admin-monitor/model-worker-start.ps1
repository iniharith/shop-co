$ErrorActionPreference = 'Stop'
$configDir = if (Test-Path -LiteralPath (Join-Path $PSScriptRoot 'settings.json')) { $PSScriptRoot } else { Join-Path $env:LOCALAPPDATA 'KampungCetak\ModelWorker' }
$logPath = Join-Path $configDir 'supervisor.log'
function Write-WorkerLog([string] $message) {
    try {
        if ((Test-Path -LiteralPath $logPath) -and (Get-Item -LiteralPath $logPath).Length -gt 524288) { Move-Item -LiteralPath $logPath -Destination ($logPath + '.previous') -Force }
        Add-Content -LiteralPath $logPath -Value ("{0:o} {1}" -f [DateTime]::UtcNow, $message)
    } catch {}
}
$workerMutex = New-Object Threading.Mutex($false, 'Local\KampungCetakModelWorker')
$owned = $false
try {
    try { $owned = $workerMutex.WaitOne(0) } catch [Threading.AbandonedMutexException] { $owned = $true }
    if (-not $owned) { exit 0 }
    while ($true) {
        $pointer = [IntPtr]::Zero
        $worker = $null
        try {
            $config = Get-Content -LiteralPath (Join-Path $configDir 'settings.json') -Raw | ConvertFrom-Json
            $secret = Import-Clixml -LiteralPath (Join-Path $configDir 'secret.xml')
            if ($secret -isnot [securestring]) { throw 'Invalid encrypted worker credential' }
            $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
            $env:MODEL_BRIDGE_URL = $config.bridgeUrl
            $env:MODEL_BRIDGE_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
            $binRoot = Split-Path (Split-Path $config.codexExecutable -Parent) -Parent
            $latest = Get-ChildItem -LiteralPath $binRoot -Directory -ErrorAction SilentlyContinue |
                ForEach-Object { $exe = Join-Path $_.FullName 'codex.exe'; if (Test-Path -LiteralPath $exe) { Get-Item -LiteralPath $exe } } |
                Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1
            if ($latest) { $env:CODEX_PC_EXECUTABLE = $latest.FullName }
            elseif ($config.codexExecutable -and (Test-Path -LiteralPath $config.codexExecutable)) { $env:CODEX_PC_EXECUTABLE = $config.codexExecutable }
            else { throw 'No installed Codex executable found' }
            if ($config.codexCwd) { $env:CODEX_PC_CWD = $config.codexCwd }
            $started = [DateTime]::UtcNow
            $worker = Start-Process -FilePath $config.nodePath -ArgumentList ('"' + $config.workerPath + '"') -WorkingDirectory $configDir -WindowStyle Hidden -PassThru
            Write-WorkerLog ("Started worker PID {0}" -f $worker.Id)
            while (-not $worker.WaitForExit(10000)) {
                $healthFile = Join-Path $configDir 'worker-health.json'
                $lastSignal = $started
                if (Test-Path -LiteralPath $healthFile) {
                    $modified = (Get-Item -LiteralPath $healthFile).LastWriteTimeUtc
                    if ($modified -gt $lastSignal) { $lastSignal = $modified }
                }
                if (([DateTime]::UtcNow - $lastSignal).TotalMinutes -gt 6) {
                    Write-WorkerLog 'Worker unresponsive for six minutes; stopping its process tree for recovery'
                    & "$env:SystemRoot\System32\taskkill.exe" /PID $worker.Id /T /F | Out-Null
                    break
                }
            }
            Write-WorkerLog ("Worker exited; retrying in five seconds")
        } catch {
            Write-WorkerLog ("Worker setup/start failed ({0}); retrying" -f $_.Exception.GetType().Name)
        } finally {
            Remove-Item Env:MODEL_BRIDGE_SECRET, Env:MODEL_BRIDGE_URL -ErrorAction SilentlyContinue
            if ($pointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        }
        Start-Sleep -Seconds 5
    }
} finally {
    if ($owned) { $workerMutex.ReleaseMutex() }
    $workerMutex.Dispose()
}
