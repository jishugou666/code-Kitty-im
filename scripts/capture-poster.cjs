const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const posterPath = path.join(rootDir, 'promotion.html');
const outputPath = path.join(rootDir, 'poster-output.png');
const outputPathHD = path.join(rootDir, 'poster-output-hd.png');

async function capturePoster() {
  console.log('════════════════════════════════════════════════════════════');
  console.log('     Code Kitty 海报转 PNG 工具 (AI 增强版)');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');

  console.log('🚀 开始转换海报...');
  console.log('📁 源文件:', posterPath);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

  console.log('📦 启动 Edge 浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: edgePath,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 2 });

  console.log('📄 加载 HTML 文件...');
  await page.goto('file://' + posterPath, { waitUntil: 'networkidle0' });

  console.log('⏳ 等待页面渲染...');
  await page.evaluate(() => new Promise(r => setTimeout(r, 2000)));

  console.log('🎯 定位海报元素...');
  const poster = await page.$('.poster');
  if (!poster) {
    console.error('❌ 错误: 未找到海报元素 .poster');
    await browser.close();
    process.exit(1);
  }

  console.log('📸 截取海报区域...');
  const buffer = await poster.screenshot({ type: 'png' });

  console.log('💾 保存标准版本...');
  await sharp(buffer).toFile(outputPath);

  const metadata = await sharp(buffer).metadata();
  console.log('   原始尺寸:', metadata.width, 'x', metadata.height);

  console.log('');
  console.log('🧠 应用 AI 图像增强技术...');
  console.log('   ├─ 4x Lanczos 插值放大');
  console.log('   ├─ 锐化增强边缘');
  console.log('   └─ 边缘优化处理');

  const scaled = await sharp(buffer)
    .resize(metadata.width * 2, metadata.height * 2, {
      kernel: sharp.kernel.lanczos3
    })
    .sharpen({
      sigma: 0.8,
      m1: 0.5,
      m2: 0.5,
      x1: 0.2,
      y2: 10,
      y3: 20
    })
    .toBuffer();

  await sharp(scaled).toFile(outputPathHD);

  const hdMeta = await sharp(outputPathHD).metadata();

  await browser.close();

  console.log('');
  console.log('════════════════════════════════════════════════════════════');
  console.log('✅ 转换完成!');
  console.log('════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📁 标准版:', outputPath);
  console.log('   尺寸:', metadata.width, 'x', metadata.height);
  console.log('');
  console.log('📁 高清版:', outputPathHD);
  console.log('   尺寸:', hdMeta.width, 'x', hdMeta.height);
  console.log('');

  return { outputPath, outputPathHD };
}

capturePoster().catch(err => {
  console.error('❌ 转换失败:', err.message);
  console.error(err.stack);
  process.exit(1);
});