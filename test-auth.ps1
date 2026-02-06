# Script para probar registro y login con MongoDB

$backendUrl = "http://localhost:3000/api"

# Test 1: Registrar un nuevo usuario
Write-Host "=== TEST 1: Registrando nuevo usuario ===" -ForegroundColor Cyan

$registerPayload = @{
    firstName = "Juan"
    lastName = "Pérez"
    email = "juan.perez@example.com"
    employeeNumber = "EMP001"
    password = "SecurePassword123"
} | ConvertTo-Json

$registerResponse = Invoke-RestMethod -Uri "$backendUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerPayload

Write-Host "✓ Usuario registrado exitosamente" -ForegroundColor Green
Write-Host ($registerResponse | ConvertTo-Json) -ForegroundColor Yellow

Write-Host "`n=== TEST 2: Login con credenciales correctas ===" -ForegroundColor Cyan

$loginPayload = @{
    email = "juan.perez@example.com"
    password = "SecurePassword123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "$backendUrl/auth/login" -Method POST -ContentType "application/json" -Body $loginPayload

Write-Host "✓ Login exitoso" -ForegroundColor Green
Write-Host ($loginResponse | ConvertTo-Json) -ForegroundColor Yellow

Write-Host "`n=== TEST 3: Registrando segundo usuario ===" -ForegroundColor Cyan

$registerPayload2 = @{
    firstName = "María"
    lastName = "González"
    email = "maria.gonzalez@example.com"
    employeeNumber = "EMP002"
    password = "AnotherPassword456"
} | ConvertTo-Json

$registerResponse2 = Invoke-RestMethod -Uri "$backendUrl/auth/register" -Method POST -ContentType "application/json" -Body $registerPayload2

Write-Host "✓ Segundo usuario registrado exitosamente" -ForegroundColor Green
Write-Host ($registerResponse2 | ConvertTo-Json) -ForegroundColor Yellow

Write-Host "`n=== PRUEBAS COMPLETADAS ===" -ForegroundColor Green
