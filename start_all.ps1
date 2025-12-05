Write-Host "========================================" -ForegroundColor Cyan
Write-Host "드라마 캐릭터 AI 챗봇 시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/2] 백엔드 서버 시작 중..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; python main.py" -WindowStyle Normal

Start-Sleep -Seconds 3

Write-Host "[2/2] 프론트엔드 서버 시작 중..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\frontend'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "서버 시작 완료!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host "백엔드: http://localhost:8000" -ForegroundColor White
Write-Host "프론트엔드: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "브라우저가 자동으로 열립니다..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Start-Process "http://localhost:3000"

