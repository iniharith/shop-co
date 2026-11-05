$ErrorActionPreference = 'Stop'
$workerMutex = New-Object Threading.Mutex($false, 'Local\KampungCetakModelWorker')
if (-not $workerMutex.WaitOne(0)) { exit 0 }
$configDir = Join-Path $env:LOCALAPPDATA 'KampungCetak\ModelWorker'
$config = Get-Content -LiteralPath (Join-Path $configDir 'settings.json') -Raw | ConvertFrom-Json
$secret = Import-Clixml -LiteralPath (Join-Path $configDir 'secret.xml')
if ($secret -isnot [securestring]) { throw 'The model-worker credential is invalid.' }
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:MODEL_BRIDGE_URL = $config.bridgeUrl
    $currentCodex = Get-Command codex.exe -ErrorAction SilentlyContinue
    if ($currentCodex) { $env:CODEX_PC_EXECUTABLE = $currentCodex.Source }
    elseif ($config.codexExecutable) { $env:CODEX_PC_EXECUTABLE = $config.codexExecutable }
    if ($config.codexCwd) { $env:CODEX_PC_CWD = $config.codexCwd }
    $env:MODEL_BRIDGE_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    $worker = Start-Process -FilePath $config.nodePath -ArgumentList ('"' + $config.workerPath + '"') -WorkingDirectory $configDir -WindowStyle Hidden -PassThru -Wait
    if ($worker.ExitCode -ne 0) { exit $worker.ExitCode }
} finally {
    Remove-Item Env:MODEL_BRIDGE_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:MODEL_BRIDGE_URL -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $workerMutex.ReleaseMutex()
    $workerMutex.Dispose()
}
