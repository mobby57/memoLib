# Add DOTENV_KEY to Vercel
$prodKey = 'dotenv://:key_c5a23ec9afccaac00455b6468733f07371b3f20027945742ca8b64d3df6f75df8f60f39b9edae0a4ebf6b44c6b7cf31c58dd9bb88b9e5634e6eca0c02ce3dac2@'

Write-Host "Adding DOTENV_KEY to Vercel production environment..."
Write-Host "Key: $($prodKey.Substring(0, 50))..."
Write-Host ""

# Create a temporary file for piping
$tempFile = New-TemporaryFile
Set-Content -Path $tempFile -Value $prodKey

try {
    # Run vercel env add with proper targeting
    & vercel env add DOTENV_KEY production < $tempFile
    
    Write-Host ""
    Write-Host "SUCCESS! DOTENV_KEY added to Vercel!"
    Write-Host ""
    Write-Host "Next step: Deploy to production"
    Write-Host "Command: vercel deploy --prod"
}
finally {
    Remove-Item -Path $tempFile -Force
}
