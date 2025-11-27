# 빠른 API 키 설정 및 서버 재시작 스크립트
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Google Gemini API 키 설정 및 서버 재시작" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 기존 서버 종료
Write-Host "[1/3] 기존 서버 종료 중..." -ForegroundColor Yellow
Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*python*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# API 키 입력
Write-Host ""
Write-Host "[2/3] API 키 입력" -ForegroundColor Yellow
$apiKey = Read-Host "새 API 키를 입력하세요 (또는 Enter로 기존 .env 파일 사용)"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    if (Test-Path ".env") {
        Write-Host "기존 .env 파일을 사용합니다." -ForegroundColor Green
    } else {
        Write-Host "❌ API 키가 입력되지 않았고 .env 파일도 없습니다." -ForegroundColor Red
        exit
    }
} else {
    # .env 파일 생성
    $envFile = Join-Path $PSScriptRoot ".env"
    "GOOGLE_API_KEY=$apiKey" | Out-File -FilePath $envFile -Encoding utf8 -NoNewline
    Write-Host "✅ API 키가 .env 파일에 저장되었습니다." -ForegroundColor Green
}

# 서버 시작
Write-Host ""
Write-Host "[3/3] 백엔드 서버 시작 중..." -ForegroundColor Yellow
Write-Host ""
Set-Location $PSScriptRoot
python main.py

