# Create placeholder PNG icons for the extension
# This creates simple colored squares with "G" text

$iconsDir = "public\icons"

# Ensure icons directory exists
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

Write-Host "Creating placeholder icons..." -ForegroundColor Green

# Create simple HTML file that generates icons using canvas
$htmlContent = @"
<!DOCTYPE html>
<html>
<head>
    <title>Icon Generator</title>
</head>
<body>
    <canvas id="canvas"></canvas>
    <script>
        function createIcon(size) {
            const canvas = document.getElementById('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');
            
            // Background with rounded corners
            ctx.fillStyle = '#4A90E2';
            ctx.beginPath();
            const radius = size * 0.15;
            ctx.moveTo(radius, 0);
            ctx.lineTo(size - radius, 0);
            ctx.quadraticCurveTo(size, 0, size, radius);
            ctx.lineTo(size, size - radius);
            ctx.quadraticCurveTo(size, size, size - radius, size);
            ctx.lineTo(radius, size);
            ctx.quadraticCurveTo(0, size, 0, size - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.fill();
            
            // Letter G
            ctx.fillStyle = 'white';
            ctx.font = 'bold ' + (size * 0.5) + 'px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('G', size / 2, size / 2);
            
            // Small indicator dot
            ctx.fillStyle = '#50E3C2';
            ctx.beginPath();
            ctx.arc(size * 0.75, size * 0.75, size * 0.15, 0, Math.PI * 2);
            ctx.fill();
            
            return canvas.toDataURL('image/png');
        }
        
        console.log('16:', createIcon(16));
        console.log('48:', createIcon(48));
        console.log('128:', createIcon(128));
    </script>
</body>
</html>
"@

# For now, create simple SVG files that browsers can use
$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $svgContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<svg width="$size" height="$size" viewBox="0 0 $size $size" xmlns="http://www.w3.org/2000/svg">
  <rect width="$size" height="$size" fill="#4A90E2" rx="$([math]::Round($size * 0.15))"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="$([math]::Round($size * 0.5))" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">G</text>
  <circle cx="$([math]::Round($size * 0.75))" cy="$([math]::Round($size * 0.75))" r="$([math]::Round($size * 0.15))" fill="#50E3C2"/>
</svg>
"@
    
    $filename = "$iconsDir\icon$size.svg"
    $svgContent | Out-File -FilePath $filename -Encoding UTF8
    Write-Host "  Created icon$size.svg" -ForegroundColor Gray
}

Write-Host "Placeholder icons created successfully" -ForegroundColor Green
Write-Host ""
Write-Host "Note: SVG icons created. For production, convert to PNG format." -ForegroundColor Yellow
Write-Host "Chrome and Edge extensions support SVG icons in manifest v3." -ForegroundColor Gray
