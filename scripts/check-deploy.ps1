# ============================================================
#  Verification pre-deploiement - AZUR IMMOBILIER
#  Usage : powershell -ExecutionPolicy Bypass -File scripts/check-deploy.ps1
#  Controle : presence des fichiers cles, chemins absolus
#  interdits, references internes cassees et placeholders restants.
#  NOTE : ce fichier reste en ASCII pur (compatibilite PowerShell 5.1).
# ============================================================

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $root

$fail = 0
function Warn($msg) { Write-Host "  [!] $msg" -ForegroundColor Yellow }
function Ok($msg)   { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Fail($msg) { Write-Host "  [X] $msg" -ForegroundColor Red; $script:fail++ }

Write-Host "=== Verification pre-deploiement ===`n"

# 1. Fichiers cles
foreach ($f in @("index.html", "css/style.css", "js/main.js", "favicon.svg",
                 "netlify.toml", ".nojekyll", "README.md", "DEPLOIEMENT.md")) {
    if (Test-Path $f) { Ok "present : $f" } else { Fail "manquant : $f" }
}

# 2. Pas de chemins absolus (casseraient GitHub Pages en sous-chemin)
$abs = Select-String -Path "index.html" -Pattern '(src|href)="\/' -AllMatches
if ($abs) { Fail "chemins absolus dans index.html (casent GitHub Pages)" } else { Ok "aucun chemin absolu dans index.html" }

# 3. Verifier que chaque fichier reference localement existe
$refs = Select-String -Path "index.html" -Pattern '(?:src|href|data-src|data-full|data-video|data-poster)="(?!https?:|mailto:|tel:|data:|#)([^"]+)"' -AllMatches |
    ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value.Split("#")[0].Split("?")[0] } |
    Where-Object { $_ -ne "" } | Sort-Object -Unique

$missing = @()
foreach ($r in $refs) {
    $p = $r.TrimStart("./")
    if (-not (Test-Path $p)) { $missing += $r }
}
if ($missing.Count -eq 0) { Ok ("toutes les " + $refs.Count + " references internes existent") }
else { $missing | ForEach-Object { Fail "reference cassee : $_" } }

# 4. Placeholders restants (non bloquant : contenu a personnaliser)
$ph = Select-String -Path "index.html" -Pattern "\[. completer\]|\[Nom du dirigeant|\[Adresse du cabinet|\+\d{10,}|2250000000000" -AllMatches
if ($ph) { Warn ($ph.Matches.Count.ToString() + " placeholder(s) / numero(s) d'exemple restant(s) dans index.html (a personnaliser avant mise en ligne)") }

# 5. Videos lourdes servies telles quelles ? (non bloquant, recommande)
$heavy = Get-ChildItem "assets/videos" -Filter *.mp4 -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -notlike "*-web.mp4" -and $_.Length -gt 20MB }
if ($heavy) {
    $heavy | ForEach-Object {
        Warn ("video non optimisee : " + $_.Name + " (" + [math]::Round($_.Length/1MB,0) + " Mo) - lancer scripts/optimize-videos.ps1")
    }
}

Write-Host ""
if ($fail -eq 0) {
    Write-Host ">>> Pret pour le deploiement (voir les [!] avant une mise en ligne publique)." -ForegroundColor Green
} else {
    Write-Host ">>> $fail probleme(s) bloquant(s) a corriger." -ForegroundColor Red
    exit 1
}
