$ErrorActionPreference = 'Stop'
Write-Host 'Set up the private Shop-Co AI worker. Do not paste the bridge secret into a chat.'
$bridgeText = Read-Host 'Railway model bridge HTTPS URL'
$bridgeUri = $null
if (-not [Uri]::TryCreate($bridgeText, [UriKind]::Absolute, [ref]$bridgeUri) -or $bridgeUri.Scheme -ne 'https' -or $bridgeUri.UserInfo -or $bridgeUri.Query -or $bridgeUri.Fragment) {
    throw 'Enter an HTTPS bridge URL without credentials, query, or fragment.'
}
$secret = Read-Host 'Bridge secret' -AsSecureString
if ($secret.Length -lt 32) { throw 'The bridge secret must contain at least 32 characters.' }
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$configDir = Join-Path $env:LOCALAPPDATA 'KampungCetak\ModelWorker'
New-Item -ItemType Directory -Path $configDir -Force | Out-Null
$workerPath = Join-Path $configDir 'model-worker.js'
$launcherPath = Join-Path $configDir 'model-worker-start.ps1'
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'model-worker.js') -Destination $workerPath -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'model-worker-start.ps1') -Destination $launcherPath -Force
$secret | Export-Clixml -LiteralPath (Join-Path $configDir 'secret.xml')
@{ bridgeUrl = $bridgeUri.AbsoluteUri; nodePath = $nodePath; workerPath = $workerPath } | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $configDir 'settings.json') -Encoding UTF8
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'KC AI Worker.lnk'
$shortcut = (New-Object -ComObject WScript.Shell).CreateShortcut($shortcutPath)
$shortcut.TargetPath = (Get-Command powershell.exe -ErrorAction Stop).Source
$shortcut.Arguments = "-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$launcherPath`""
$shortcut.WorkingDirectory = $configDir
$shortcut.Description = 'Start the private Kampung Cetak AI worker after sign-in'
$shortcut.Save()
Write-Host 'Worker configured for this Windows account and enabled at sign-in. Start it now by opening the KC AI Worker startup shortcut.'
