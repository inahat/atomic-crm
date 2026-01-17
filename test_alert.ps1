# Supabase Project URL (AtomicCRM)
$url = "https://bxosgtiwjkpuguyggicm.supabase.co/functions/v1/parse-ovrc-alert"

# REPLACE THIS with your actual Anon Key from Supabase Dashboard -> Settings -> API
$key = "PLACE_YOUR_ANON_KEY_HERE"

# Simulated Alert Payload
$body = @{
    subject = "OvrC Alert: TestClient - TestProject"
    body = "Device Name | TestDevice | Reference ID | TEST-12345 | Device Event | Device connected |"
    timestamp = (Get-Date).ToString("o")
} | ConvertTo-Json

# Send Request
try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers @{ "Authorization"="Bearer $key"; "Content-Type"="application/json" } -Body $body
    Write-Host "Success! Response:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 5)
} catch {
    Write-Host "Error sending alert:" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
