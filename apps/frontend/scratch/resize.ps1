param(
    [string]$imagePath,
    [string]$outputPath,
    [int]$width,
    [int]$height
)

Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile($imagePath)

$newImg = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($newImg)
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$graphics.DrawImage($img, 0, 0, $width, $height)
$tempPath = $outputPath + ".tmp.png"
$newImg.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)

$graphics.Dispose()
$newImg.Dispose()
$img.Dispose()

Move-Item -Path $tempPath -Destination $outputPath -Force
