$ErrorActionPreference = "Stop"
$base = "http://localhost:5130/api"
$passCount = 0
$failCount = 0

function Log-Pass($msg) { Write-Host "[PASS] $msg" -ForegroundColor Green; $script:passCount++ }
function Log-Fail($msg) { Write-Host "[FAIL] $msg" -ForegroundColor Red; $script:failCount++ }
function Log-Info($msg) { Write-Host "[INFO] $msg" -ForegroundColor Cyan }

Log-Info "=== Test 1: Admin Login ==="
$loginBody = '{"Email":"admin@techretail.local","Password":"Admin@12345"}'
$loginRes = Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
$adminToken = $loginRes.token
if ($adminToken) { Log-Pass "Login Admin OK" } else { Log-Fail "Login Admin FAIL"; exit 1 }

Log-Info "=== Test 2: GET /api/Permissions (Admin) ==="
$headers = @{ Authorization = "Bearer $adminToken" }
$permsRes = Invoke-RestMethod -Uri "$base/permissions" -Method Get -Headers $headers
if ($permsRes.Count -gt 0) {
    Log-Pass "GET Permissions: $($permsRes.Count) records"
} else {
    Log-Fail "GET Permissions empty"
    exit 1
}

Log-Info "=== Test 3: PUT /api/Permissions - grant perm-1 to Sales Staff ==="
$updatedItems = @()
foreach ($p in $permsRes) {
    if ($p.permissionKey -eq "perm-1" -and $p.roleName -eq "Sales Staff") {
        $updatedItems += @{ permissionKey = $p.permissionKey; roleName = $p.roleName; isGranted = $true }
    } else {
        $updatedItems += @{ permissionKey = $p.permissionKey; roleName = $p.roleName; isGranted = $p.isGranted }
    }
}
$putBody = $updatedItems | ConvertTo-Json -Depth 3
$putRes = Invoke-RestMethod -Uri "$base/permissions" -Method Put -ContentType "application/json" -Headers $headers -Body $putBody
if ($putRes.message) { Log-Pass "PUT Permissions OK: $($putRes.message)" }
else { Log-Fail "PUT Permissions FAIL"; exit 1 }

Log-Info "=== Test 4: Verify persist - GET again ==="
$permsAfter = Invoke-RestMethod -Uri "$base/permissions" -Method Get -Headers $headers
$changed = $permsAfter | Where-Object { $_.permissionKey -eq "perm-1" -and $_.roleName -eq "Sales Staff" }
if ($changed -and $changed.isGranted -eq $true) {
    Log-Pass "Persist OK: perm-1/SalesStaff isGranted=$($changed.isGranted)"
} else {
    Log-Fail "Persist FAIL: value not saved"
    exit 1
}

Log-Info "=== Test 5: No token -> 401 ==="
try {
    Invoke-RestMethod -Uri "$base/permissions" -Method Get
    Log-Fail "No token got 200 - security breach!"
    exit 1
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) { Log-Pass "No token -> 401 Unauthorized" }
    else { Log-Fail "Unexpected status: $statusCode" }
}

Log-Info "=== Restore: reset perm-1/SalesStaff to false ==="
$restoreItems = @()
foreach ($p in $permsAfter) {
    if ($p.permissionKey -eq "perm-1" -and $p.roleName -eq "Sales Staff") {
        $restoreItems += @{ permissionKey = $p.permissionKey; roleName = $p.roleName; isGranted = $false }
    } else {
        $restoreItems += @{ permissionKey = $p.permissionKey; roleName = $p.roleName; isGranted = $p.isGranted }
    }
}
$restoreBody = $restoreItems | ConvertTo-Json -Depth 3
Invoke-RestMethod -Uri "$base/permissions" -Method Put -ContentType "application/json" -Headers $headers -Body $restoreBody | Out-Null
Log-Info "Data restored."

Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "PASS: $passCount  |  FAIL: $failCount" -ForegroundColor White
Write-Host "========================================" -ForegroundColor White
if ($failCount -gt 0) { Write-Host "CODE DO - CO LOI!" -ForegroundColor Red; exit 1 }
else { Write-Host "CODE XANH - TAT CA TESTS PASS!" -ForegroundColor Green; exit 0 }
