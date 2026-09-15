Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\client\public\board_banner.png"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)

# Perfectly centered circular logo crop:
# Circle is approx diameter 290px centered at X: 190, Y: 298
$cropLogoRect = New-Object System.Drawing.Rectangle(45, 150, 290, 295)
$logoBmp = $src.Clone($cropLogoRect, $src.PixelFormat)
$logoPath = Join-Path $PSScriptRoot "..\client\public\logo.png"
$logoBmp.Save($logoPath, [System.Drawing.Imaging.ImageFormat]::Png)
$logoBmp.Dispose()

Copy-Item $logoPath -Destination (Join-Path $PSScriptRoot "..\client\src\assets\logo.png")
Copy-Item $logoPath -Destination (Join-Path $PSScriptRoot "..\uploads\logo.png")

# Brand text crop (Right of the divider line: "Positive Saving & Credit Co-operative Ltd. / साझा बचत, साझा समृद्धि"):
# X: 360, Y: 160, Width: 580, Height: 280
$cropBrandRect = New-Object System.Drawing.Rectangle(360, 160, 580, 280)
$brandBmp = $src.Clone($cropBrandRect, $src.PixelFormat)
$brandPath = Join-Path $PSScriptRoot "..\client\public\brand_title.png"
$brandBmp.Save($brandPath, [System.Drawing.Imaging.ImageFormat]::Png)
$brandBmp.Dispose()

Copy-Item $brandPath -Destination (Join-Path $PSScriptRoot "..\client\src\assets\brand_title.png")

$src.Dispose()
Write-Host "Re-cropped logo with perfect centering!"
