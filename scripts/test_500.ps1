$loginResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:5130/api/auth/login" -ContentType "application/json" -Body '{"email":"admin@techretail.local","password":"password123"}'
$token = $loginResponse.token
$headers = @{ Authorization = "Bearer $token" }
$body = @{ sku="KTD-TEST500"; productName="Test 500"; costPrice=100; sellingPrice=200; stockQuantity=10; minStockThreshold=5; imageUrl="" } | ConvertTo-Json
try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:5130/api/Products" -Headers $headers -ContentType "application/json" -Body $body
    Write-Host "Success"
} catch {
    Write-Host "Error occurred:
"
    Write-Host $_.Exception.Response
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $reader.BaseStream.Position = 0
        $reader.DiscardBufferedData()
        $responseBody = $reader.ReadToEnd();
        Write-Host "Response Body:
$responseBody"
    }
}
