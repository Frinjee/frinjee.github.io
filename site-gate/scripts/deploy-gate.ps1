# Run from site-gate/ after: npx wrangler login
# Password is read from prompt or $env:SITE_GATE_PASSWORD (never written to disk).

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (-not $env:SITE_GATE_PASSWORD) {
	$secure = Read-Host "SITE_GATE_PASSWORD" -AsSecureString
	$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
	$env:SITE_GATE_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
	[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
}

$signing = node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
$env:SITE_GATE_PASSWORD | npx wrangler secret put SITE_GATE_PASSWORD
$signing | npx wrangler secret put GATE_SIGNING_SECRET

npm test
npx wrangler deploy

Write-Host "Deployed site-gate. Verify gated URLs in incognito (see DEPLOY.md)."
