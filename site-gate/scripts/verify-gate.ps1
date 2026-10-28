# Post-deploy checks for jenhammond.me gate (run in incognito-equivalent: no cookie).

$ErrorActionPreference = "Stop"
$base = "https://jenhammond.me"

$paths = @(
	"/the-frinje-report/",
	"/the-frinje-report/issues/issue-12-exploit-archaeology.html",
	"/ff2026-chubba-league/08-16-rankings.csv"
)

foreach ($path in $paths) {
	$url = "$base$path"
	$response = Invoke-WebRequest -Uri $url -UseBasicParsing -MaximumRedirection 0 -ErrorAction SilentlyContinue
	if (-not $response) {
		$response = Invoke-WebRequest -Uri $url -UseBasicParsing
	}
	$body = $response.Content
	$gated = $response.StatusCode -eq 401 -and $body -match "Password required"
	$leaked = $body -match "THE FRINJ REPORT|Exploit Archaeology|Chubba Hubba|RK,Player"
	if ($gated) {
		Write-Host "OK gated: $path"
	} elseif ($leaked) {
		Write-Host "FAIL still public: $path (deploy site-gate or check Cloudflare routes)"
	} else {
		Write-Host "CHECK: $path status $($response.StatusCode)"
	}
}

$homeResponse = Invoke-WebRequest -Uri "$base/" -UseBasicParsing
if ($homeResponse.StatusCode -eq 200) {
	Write-Host "OK home page still public"
}

Write-Host "Bypass note: https://frinjee.github.io/the-frinje-report/ may remain public (see DEPLOY.md Phase 2)."
