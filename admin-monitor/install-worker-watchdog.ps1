param([string] $InstallRoot)
$ErrorActionPreference = 'Stop'
$configDir = if ($InstallRoot) { $InstallRoot } else { Join-Path $env:LOCALAPPDATA 'KampungCetak\ModelWorker' }
$launcher = Join-Path $configDir 'model-worker-start.ps1'
if (-not (Test-Path -LiteralPath $launcher)) { throw 'Configure the model/PC worker first.' }
$user = [Security.Principal.WindowsIdentity]::GetCurrent().Name
$action = New-ScheduledTaskAction -Execute (Get-Command powershell.exe).Source -Argument ('-NoProfile -NonInteractive -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $launcher + '"') -WorkingDirectory (Join-Path $env:SystemRoot 'System32')
$logon = New-ScheduledTaskTrigger -AtLogOn -User $user
$watchdog = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit ([TimeSpan]::Zero) -MultipleInstances IgnoreNew -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $user -LogonType Interactive -RunLevel Limited
Register-ScheduledTask -TaskName 'KC Telegram PC Worker' -Action $action -Trigger @($logon,$watchdog) -Settings $settings -Principal $principal -Description 'Keep the private Telegram PC worker running while this Windows user is signed in.' -Force | Out-Null
if ((Get-ScheduledTask -TaskName 'KC Telegram PC Worker').State -ne 'Running') { Start-ScheduledTask -TaskName 'KC Telegram PC Worker' }
Write-Host 'Worker watchdog installed: starts at sign-in, checked every minute, restarts after a crash.'
