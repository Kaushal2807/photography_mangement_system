$body = @{ studioName='ABC Studio'; ownerName='John Doe'; mobile='9876543210'; email='john@example.com'; password='Password123'; confirmPassword='Password123' } | ConvertTo-Json
try {
  Invoke-RestMethod -Method Post -Uri 'http://localhost:3000/setup' -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
} catch {
  $_.Exception.Message
}
