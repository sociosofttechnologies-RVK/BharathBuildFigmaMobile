# Copies the real BharathBuild logo and hero photo from the web app into this project
# (the files in assets/images are placeholders with the same names).
# Usage (PowerShell, from this folder):  .\scripts\copy-web-assets.ps1 "D:\Users\HP\Desktop\bharathbuild-mobile-designs\site-source-deal"
param([string]$WebRepo = "D:\Users\HP\Desktop\bharathbuild-mobile-designs\site-source-deal")
$src = Join-Path $WebRepo "src\assets"
$dst = Join-Path $PSScriptRoot "..\assets\images"
foreach ($f in "bharathbuild-logo-full.png", "bharathbuild-logo.png", "hero-construction.jpg") {
  Copy-Item (Join-Path $src $f) (Join-Path $dst $f) -Force
  Write-Host "Copied $f"
}
