# ============================================================
#  Mini serveur statique local (dev uniquement)
#  Usage : powershell -ExecutionPolicy Bypass -File scripts/serve.ps1 [-Port 8123]
#  Ne répond que sur 127.0.0.1. Ctrl+C pour arrêter.
# ============================================================
param(
    [int]$Port = 8123
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

# PID écrit sur disque pour permettre un arrêt propre (taskkill /PID ...)
Set-Content -Path (Join-Path $PSScriptRoot "serve.pid") -Value $PID -Encoding ASCII

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "text/javascript; charset=utf-8"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".png"  = "image/png"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".mp4"  = "video/mp4"
    ".webm" = "video/webm"
    ".json" = "application/json"
    ".woff2"= "font/woff2"
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://127.0.0.1:$Port/")
$listener.Start()
Write-Host "Serveur statique demarre : http://127.0.0.1:$Port/  (racine : $root)"

try {
    while ($listener.IsListening) {
        $ctx   = $listener.GetContext()
        $path  = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
        if ($path -eq "/") { $path = "/index.html" }

        $full = Join-Path $root ($path -replace "/", "\")
        $full = [System.IO.Path]::GetFullPath($full)

        # Securite : rester sous la racine du projet
        if (-not $full.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
            $ctx.Response.StatusCode = 403
            $ctx.Response.Close()
            continue
        }

        if (Test-Path $full -PathType Leaf) {
            $ext  = [System.IO.Path]::GetExtension($full).ToLowerInvariant()
            $resp = $ctx.Response
            $resp.StatusCode = 200
            if ($mime.ContainsKey($ext)) { $resp.ContentType = $mime[$ext] }
            $bytes = [System.IO.File]::ReadAllBytes($full)
            $resp.ContentLength64 = $bytes.Length
            $resp.SendChunked = $false
            $resp.OutputStream.Write($bytes, 0, $bytes.Length)
            $resp.OutputStream.Close()
            Write-Host ("200 {0}" -f $path)
        } else {
            $ctx.Response.StatusCode = 404
            $buf = [System.Text.Encoding]::UTF8.GetBytes("Not found")
            $ctx.Response.OutputStream.Write($buf, 0, $buf.Length)
            $ctx.Response.Close()
            Write-Host ("404 {0}" -f $path)
        }
    }
} finally {
    $listener.Stop()
}
