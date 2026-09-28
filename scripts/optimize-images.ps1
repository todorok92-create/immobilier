# ============================================================
#  Generation de miniatures optimisees pour le web
#  Usage : powershell -ExecutionPolicy Bypass -File scripts/optimize-images.ps1
#  - Lit les photos de assets/img/<bien>/*.jpg
#  - Ecrit des versions allegées (max 1600px, JPEG qualite 80)
#    dans assets/img/thumbs/<bien>-<n>.jpg
#  Aucune dependance externe (Windows + .NET System.Drawing).
# ============================================================

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root    = Join-Path $PSScriptRoot ".."
$imgDir  = Join-Path $root "assets\img"
$outDir  = Join-Path $imgDir "thumbs"
$MaxSide = 1600
$Quality = 80

if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

# Codec JPEG avec parametre de qualite
$codecJar = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
    [System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)

Get-ChildItem -Path $imgDir -Directory |
    Where-Object { $_.Name -notin @("thumbs", "posters") } |
    ForEach-Object {
        $bien = $_.Name
        $i = 0
        Get-ChildItem -Path $_.FullName -Filter *.jpg | Sort-Object Name |
        ForEach-Object {
            $i++
            $outName = "{0}-{1:d2}.jpg" -f $bien, $i
            $outPath = Join-Path $outDir $outName

            $src = [System.Drawing.Image]::FromFile($_.FullName)
            try {
                $ratio = [Math]::Min($MaxSide / $src.Width, $MaxSide / $src.Height)
                if ($ratio -gt 1) { $ratio = 1 }
                $w = [int][Math]::Round($src.Width  * $ratio)
                $h = [int][Math]::Round($src.Height * $ratio)

                $bmp = New-Object System.Drawing.Bitmap($w, $h)
                try {
                    $g = [System.Drawing.Graphics]::FromImage($bmp)
                    try {
                        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                        $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                        $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                        $g.DrawImage($src, 0, 0, $w, $h)
                    } finally { $g.Dispose() }

                    $bmp.Save($outPath, $codecJar, $ep)
                } finally { $bmp.Dispose() }
            } finally { $src.Dispose() }

            $kb = [int]((Get-Item $outPath).Length / 1KB)
            Write-Host ("OK  {0}  ->  {1} ({2} Ko)" -f $_.Name, $outName, $kb)
        }
    }

Write-Host "`nTermine : miniatures dans assets/img/thumbs/"
