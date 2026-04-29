param(
  [int]$Port = 4173,
  [string]$HostName = "127.0.0.1"
)

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$NodeCandidates = @(
  "D:\node.js\node.exe",
  "C:\Program Files\nodejs\node.exe"
)

$NodePath = $NodeCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $NodePath) {
  $NodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($NodeCommand) {
    $NodePath = $NodeCommand.Source
  }
}

if (-not $NodePath) {
  throw "Node.js was not found. Please update NodeCandidates in deploy-local.ps1."
}

Push-Location $ProjectRoot
try {
  & $NodePath "launch-local.js" $Port $HostName
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}
