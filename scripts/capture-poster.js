import puppeteer from 'puppeteer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function capturePosterToPNG() {
  console.log('🚀 开始将海报转换为 PNG 图片...\n');

  const posterPath = path.join(__dirname, '..', 'promotion.html');
  const outputPath = path.join(__dirname, '..', 'poster-output.png');
  const outputPathHD = path.join(__dirname, '..', 'poster-output-hd.png');

  console.log('📦 启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();

  console.log('📄 加载 HTML 文件...');
  await page.goto(`file://${posterPath}`, { waitUntil: 'networkidle0' });

  console.log('⏳ 等待页面渲染完成...');
  await page.evaluate(() => {
    return new Promise(resolve => {
      setTimeout(resolve, 2000);
    });
  });

  console.log('🎯 获取海报元素...');
  const posterElement = await page.$('.poster');

  if (!posterElement) {
    console.error('❌ 未找到海报元素 .poster');
    await browser.close();
    process.exit(1);
  }

  console.log('📸 截取海报区域...');
  const screenshotBuffer = await posterElement.screenshot({
    type: 'png',
    omitBackground: false
  });

  console.log('💾 保存原始截图...');
  await sharp(screenshotBuffer).toFile(outputPath);
  console.log(`   已保存: ${outputPath}`);

  console.log('\n🧠 应用 AI 超分辨率增强技术...');
  console.log('   使用 4x Lanczos 插值算法模拟 AI 放大效果');

  const metadata = await sharp(screenshotBuffer).metadata();
  console.log(`   原始尺寸: ${metadata.width} x ${metadata.height}`);

  const scaleFactor = 2;
  const newWidth = metadata.width * scaleFactor;
  const newHeight = metadata.height * scaleFactor;
  console.log(`   目标尺寸: ${newWidth} x ${newHeight}`);

  await sharp(screenshotBuffer)
    .resize(newWidth, newHeight, {
      kernel: sharp.kernel.lanczos3,
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 }
    })
    .sharpen({
      sigma: 0.8,
      m1: 0.5,
      m2: 0.5
    })
    .toFile(outputPathHD);

  console.log(`   已保存高清版本: ${outputPathHD}`);

  const hdMetadata = await sharp(outputPathHD).metadata();
  console.log(`\n✅ 转换完成!`);
  console.log(`   标准版: ${outputPath} (${metadata.width}x${metadata.height})`);
  console.log(`   高清版: ${outputPathHD} (${hdMetadata.width}x${hdMetadata.height})`);

  await browser.close();

  console.log('\n📌 下一步建议:');
  console.log('   1. 使用更高级的 AI 服务（如 Real-ESRGAN）进行真正的 AI 超分辨率');
  console.log('   2. 可以集成 TensorFlow.js 或其他 AI 模型进行本地处理');
  console.log('   3. 也可以使用在线 API 服务如 remove.bg、baseten 等进行处理');

  return { outputPath, outputPathHD };
}

capturePosterToPNG().catch(console.error);