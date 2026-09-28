# ============================================================
#  Optimisation des videos pour la production
#  Prerequis : FFmpeg installe et accessible dans le PATH
#  Usage :
#    powershell -ExecutionPolicy Bypass -File scripts/optimize-videos.ps1
#  Genere assets/videos/<nom>-web.mp4 (~8 Mo) a partir de chaque
#  *.mp4 (sauf *-web.mp4 deja presents).
#  IMPORTANT : ensuite, remplacer dans index.html les chemins
#  assets/videos/*.mp4 par assets/videos/*-web.mp4.
#  NOTE : ce fichier reste en ASCII pur (compatibilite PowerShell 5.1).
# ============================================================

$ErrorActionPreference = "Stop"

$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
    Write-Host "ERREUR : ffmpeg est introuvable dans le PATH." -ForegroundColor Red
    Write-Host "Installation : winget install Gyan.FFmpeg   (ou https://ffmpeg.org/download.html)"
    exit 1
}

$vidDir = Join-Path $PSScriptRoot "..\assets\videos"
$outFiles = @()

Get-ChildItem -Path $vidDir -Filter *.mp4 | Where-Object { $_.Name -notlike "*-web.mp4" } |
ForEach-Object {
    $outName = $_.BaseName + "-web.mp4"
    $outPath = Join-Path $vidDir $outName
    Write-Host "Encodage : $($_.Name) -> $outName ..."
    & ffmpeg -y -i $_.FullName `
        -vf "scale=-2:720" -c:v libx264 -crf 26 -preset slow `
        -c:a aac -b:a 96k -movflags +faststart `
        $outPath 2>$null
    if ($LASTEXITCODE -eq 0) {
        $before = [math]::Round($_.Length / 1MB, 1)
        $after  = [math]::Round((Get-Item $outPath).Length / 1MB, 1)
        Write-Host ("  OK  {0} Mo -> {1} Mo" -f $before, $after) -ForegroundColor Green
        $outFiles += $outName
    } else {
        Write-Host "  ECHEC sur $($_.Name)" -ForegroundColor Red
    }
}

if ($outFiles.Count -gt 0) {
    Write-Host ""
    Write-Host ("Fichiers generes : " + ($outFiles -join ", "))
    Write-Host ""
    Write-Host ">>> Etape suivante : dans index.html, remplacer" -ForegroundColor Yellow
    Write-Host ">>> assets/videos/<nom>.mp4  par  assets/videos/<nom>-web.mp4" -ForegroundColor Yellow
    Write-Host ">>> (4 occurrences : hero, carte Bassam, cartes visites)" -ForegroundColor Yellow
} else {
    Write-Host "Rien a encoder (aucun *.mp4 non optimise trouve)."
}
