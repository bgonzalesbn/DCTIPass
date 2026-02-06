# Script para convertir imágenes PNG a base64 y cargar en MongoDB
$downloadsPath = "C:\Users\bgonzalezs\Downloads"
$seedUrl = "http://localhost:3000/badges/seed"

# Mapear nombres de archivos a nombres de insignias
$badgeMap = @{
    "IT Experience - D tecnologia.png" = "Experience DT"
    "Supervision y control - sistema nervioso.png" = "Sistema Nervioso Super"
    "Operaciones - Corazon.png" = "Corazón Opera"
    "Gestion y mejora - Sangre.png" = "Sangre Gestión"
    "Gente BN - doctores.png" = "Doctores Genl"
    "Estrategia digital - mente.png" = "Mente Estrate"
    "Entrega - musculo.png" = "Músculos Entrega"
    "Arquitectura - esqueleto.png" = "Esqueleto Aro"
}

# Array para almacenar los badges con base64
$badges = @()

# Procesar cada imagen
foreach ($fileName in $badgeMap.Keys) {
    $filePath = Join-Path $downloadsPath $fileName
    $badgeName = $badgeMap[$fileName]
    
    if (Test-Path $filePath) {
        Write-Host "Procesando: $badgeName ($fileName)" -ForegroundColor Cyan
        
        # Leer la imagen como bytes
        $imageBytes = [System.IO.File]::ReadAllBytes($filePath)
        
        # Convertir a base64
        $base64Image = [System.Convert]::ToBase64String($imageBytes)
        $dataUrl = "data:image/png;base64,$base64Image"
        
        # Crear objeto badge
        $badge = @{
            name = $badgeName
            imageUrl = $dataUrl
        }
        
        $badges += $badge
        Write-Host "  ✓ Convertido a base64 (tamaño: $($base64Image.Length) caracteres)" -ForegroundColor Green
    }
    else {
        Write-Host "  ✗ Archivo no encontrado: $filePath" -ForegroundColor Red
    }
}

# Convertir array a JSON
$json = $badges | ConvertTo-Json -Depth 10

Write-Host "`nEnviando $($badges.Count) badges a MongoDB..." -ForegroundColor Yellow

# Enviar a la API
try {
    $response = Invoke-WebRequest -Uri $seedUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $json `
        -ErrorAction Stop
    
    Write-Host "✓ Badges cargados exitosamente!" -ForegroundColor Green
    Write-Host "Respuesta del servidor:" -ForegroundColor Cyan
    ($response.Content | ConvertFrom-Json) | ConvertTo-Json -Depth 5
}
catch {
    Write-Host "✗ Error al cargar badges:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
