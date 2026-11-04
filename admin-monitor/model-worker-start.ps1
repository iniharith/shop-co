$ErrorActionPreference = 'Stop'
$configDir = Join-Path $env:LOCALAPPDATA 'KampungCetak\ModelWorker'
$config = Get-Content -LiteralPath (Join-Path $configDir 'settings.json') -Raw | ConvertFrom-Json
$secret = Import-Clixml -LiteralPath (Join-Path $configDir 'secret.xml')
if ($secret -isnot [securestring]) { throw 'The model-worker credential is invalid.' }
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try {
    $env:MODEL_BRIDGE_URL = $config.bridgeUrl
    $env:MODEL_BRIDGE_SECRET = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
    & $config.nodePath $config.workerPath
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Remove-Item Env:MODEL_BRIDGE_SECRET -ErrorAction SilentlyContinue
    Remove-Item Env:MODEL_BRIDGE_URL -ErrorAction SilentlyContinue
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
}
