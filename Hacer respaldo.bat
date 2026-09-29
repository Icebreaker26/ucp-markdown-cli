@echo off
cd /d "%~dp0"
title Respaldo del informe
powershell -NoProfile -Command "$m = Get-Date -Format 'yyyy-MM-dd_HHmm'; New-Item -ItemType Directory -Force -Path 'respaldos' | Out-Null; $items = @('capitulos','fuentes.json','portada.json','ia-log.md') | Where-Object { Test-Path $_ }; if ($items.Count -eq 0) { Write-Host 'No hay nada que respaldar todavia.' } else { $destino = 'respaldos\respaldo-' + $m + '.zip'; Compress-Archive -Path $items -DestinationPath $destino -Force; Write-Host ('Respaldo creado: ' + $destino) }"
echo.
pause
