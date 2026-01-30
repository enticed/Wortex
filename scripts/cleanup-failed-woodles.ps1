# Cleanup script for failed Woodles setup
# Run this if the clone script failed and you want to start over

Write-Host "Woodles Cleanup Script" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

$woodlesDir = "..\Woodles"

if (Test-Path $woodlesDir) {
    Write-Host "Found Woodles directory at: $woodlesDir" -ForegroundColor Yellow
    $confirm = Read-Host "Do you want to delete it? (yes/no)"

    if ($confirm -eq "yes") {
        Write-Host "Deleting Woodles directory..." -ForegroundColor Yellow
        Remove-Item -Path $woodlesDir -Recurse -Force
        Write-Host "Done! You can now run the clone script again." -ForegroundColor Green
    } else {
        Write-Host "Cancelled. Directory not deleted." -ForegroundColor Yellow
    }
} else {
    Write-Host "No Woodles directory found at: $woodlesDir" -ForegroundColor Green
    Write-Host "Nothing to clean up." -ForegroundColor Green
}

Write-Host ""
Read-Host "Press Enter to exit"
