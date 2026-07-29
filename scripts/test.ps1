$ErrorActionPreference = "Stop"

$apiUrl = "http://localhost:5130/api/auth/login"
$email = "admin@techretail.local"
$wrongPassword = "WrongPassword123!"

Write-Host "Running Test 1: Wrong Password"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = $wrongPassword })
} catch {
    Write-Host "Test 1 Passed: $_"
}

Write-Host "Running Test 2: Wrong Password"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = $wrongPassword })
} catch {
    Write-Host "Test 2 Passed: $_"
}

Write-Host "Running Test 3: Wrong Password"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = $wrongPassword })
} catch {
    Write-Host "Test 3 Passed: $_"
}

Write-Host "Running Test 4: Wrong Password"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = $wrongPassword })
} catch {
    Write-Host "Test 4 Passed: $_"
}

Write-Host "Running Test 5: Wrong Password (Should trigger lockout)"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = $wrongPassword })
} catch {
    Write-Host "Test 5 Passed: $_"
}

Write-Host "Running Test 6: Correct Password (Should be locked out)"
try {
    Invoke-RestMethod -Uri $apiUrl -Method Post -ContentType "application/json" -Body (ConvertTo-Json @{ Email = $email; Password = "Admin@12345" })
    Write-Host "Test 6 Failed: User was able to log in but should be locked out!"
    exit 1
} catch {
    $response = $_.Exception.Response
    $stream = $response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $body = $reader.ReadToEnd()
    if ($body -match "Account locked") {
        Write-Host "Test 6 Passed: User is locked out. Message: $body"
    } else {
        Write-Host "Test 6 Failed with unexpected message: $body"
        exit 1
    }
}

Write-Host "All 5+ tests passed! Code is GREEN."
