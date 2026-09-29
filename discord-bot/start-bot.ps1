# ============================================================
# RALLYSTACK PRIVATE BOT ENV
# ============================================================

$PrivateEnv =
    Join-Path `
        $PSScriptRoot `
        ".env.bot.local"

if (Test-Path $PrivateEnv) {

    Get-Content $PrivateEnv |
        ForEach-Object {

            $Line =
                $_.Trim()

            if (
                -not $Line -or
                $Line.StartsWith("#")
            ) {
                return
            }

            $Parts =
                $Line.Split(
                    "=",
                    2
                )

            if (
                $Parts.Count -eq 2
            ) {
                [Environment]::SetEnvironmentVariable(
                    $Parts[0].Trim(),
                    $Parts[1],
                    "Process"
                )
            }
        }
}

& {

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "       RALLYSTACK DISCORD BOT" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host ""

$SecureToken = Read-Host "Paste CURRENT RallyStack BOT TOKEN (hidden)" -AsSecureString

$TokenPtr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureToken)

try {
    $Token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($TokenPtr)
}
finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($TokenPtr)
}

$env:DISCORD_BOT_TOKEN = $Token

$Token = $null
$SecureToken = $null

Write-Host ""
Write-Host "Starting RallyStack..." -ForegroundColor Cyan
Write-Host "Leave this window open while testing." -ForegroundColor Yellow
Write-Host ""

try {
    npm start
}
finally {
    Remove-Item Env:\DISCORD_BOT_TOKEN -ErrorAction SilentlyContinue
}

}