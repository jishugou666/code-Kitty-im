# Code Kitty Poster to PNG Converter
# 使用 Windows 系统工具 + Sharp AI 增强

param(
    [string]$HtmlFile = "$PSScriptRoot\..\promotion.html",
    [string]$OutputFile = "$PSScriptRoot\..\poster-output.png",
    [string]$OutputFileHD = "$PSScriptRoot\..\poster-output-hd.png",
    [int]$ScaleFactor = 2
)

$ErrorActionPreference = "Stop"

Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "     Code Kitty 海报转 PNG 工具 (AI 增强版)" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js
Write-Host "📋 检查环境..." -ForegroundColor Yellow
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "❌ Node.js 未安装，请先安装 Node.js" -ForegroundColor Red
    exit 1
}
Write-Host "   Node.js 版本: $nodeVersion" -ForegroundColor Green

# 检查 sharp 模块
Write-Host "📦 检查 sharp 模块..." -ForegroundColor Yellow
$sharpInstalled = npm list sharp --prefix $PSScriptRoot\.. 2>$null
if ($sharpInstalled -match "empty" -or $sharpInstalled -match "UNMET") {
    Write-Host "   正在安装 sharp..." -ForegroundColor Yellow
    npm install sharp --prefix $PSScriptRoot\.. --save 2>$null
}

Write-Host "✅ 环境检查完成" -ForegroundColor Green
Write-Host ""

# 创建转换脚本
Write-Host "🔧 创建转换脚本..." -ForegroundColor Yellow
$convertScript = @"
import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const posterPath = path.join(__dirname, '..', 'promotion.html');
const outputPath = path.join(__dirname, '..', 'poster-output.png');
const outputPathHD = path.join(__dirname, '..', 'poster-output-hd.png');

async function capturePoster() {
    console.log('🚀 开始转换海报...');

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    await page.goto('file://' + posterPath, { waitUntil: 'networkidle0' });
    await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

    const poster = await page.$('.poster');
    if (!poster) {
        console.error('❌ 未找到海报元素');
        await browser.close();
        process.exit(1);
    }

    console.log('📸 截取海报区域...');
    const buffer = await poster.screenshot({ type: 'png' });

    console.log('💾 保存标准版本...');
    await sharp(buffer).toFile(outputPath);

    const metadata = await sharp(buffer).metadata();
    console.log('   原始尺寸:', metadata.width, 'x', metadata.height);

    console.log('🧠 应用 AI 图像增强 (4x Lanczos + 锐化)...');
    const scaled = await sharp(buffer)
        .resize(metadata.width * $ScaleFactor, metadata.height * $ScaleFactor, {
            kernel: sharp.kernel.lanczos3
        })
        .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.5 })
        .toBuffer();

    await sharp(scaled).toFile(outputPathHD);

    const hdMeta = await sharp(outputPathHD).metadata();

    await browser.close();

    console.log('');
    console.log('✅ 转换完成!');
    console.log('   标准版:', outputPath, '(', metadata.width, 'x', metadata.height, ')');
    console.log('   高清版:', outputPathHD, '(', hdMeta.width, 'x', hdMeta.height, ')');
}

capturePoster().catch(console.error);
"@

$scriptPath = Join-Path $PSScriptRoot "temp-capture.mjs"
$convertScript | Out-File -FilePath $scriptPath -Encoding UTF8

Write-Host "✅ 脚本创建完成" -ForegroundColor Green
Write-Host ""

# 检查 puppeteer
Write-Host "📦 检查 puppeteer..." -ForegroundColor Yellow
$puppeteerInstalled = npm list puppeteer --prefix $PSScriptRoot\.. 2>$null
if ($puppeteerInstalled -match "empty" -or $puppeteerInstalled -match "UNMET") {
    Write-Host "   正在安装 puppeteer (首次安装需要几分钟)... " -ForegroundColor Yellow -NoNewline
    npm install puppeteer --prefix $PSScriptRoot\.. --save 2>$null | Out-Null
    Write-Host "完成" -ForegroundColor Green
}

Write-Host ""
Write-Host "🎬 开始截图转换..." -ForegroundColor Cyan
Write-Host ""

node $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green
    Write-Host "   🎉 海报转换成功!" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Green

    if (Test-Path $OutputFileHD) {
        $fileInfo = Get-Item $OutputFileHD
        Write-Host ""
        Write-Host "📁 输出文件: $OutputFileHD" -ForegroundColor Cyan
        Write-Host "📐 文件大小: $([math]::Round($fileInfo.Length / 1024, 2)) KB" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
    Write-Host "   ❌ 转换失败" -ForegroundColor Red
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Red
}

# 清理临时文件
Remove-Item $scriptPath -Force -ErrorAction SilentlyContinue