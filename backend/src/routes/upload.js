import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadToImgBB, extractBase64FromDataURL } from '../utils/imgbb.js';

const router = Router();

router.post('/image', authMiddleware, async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ code: 400, data: null, msg: '请提供图片数据' });
    }

    let base64Data = image;
    const extracted = extractBase64FromDataURL(image);
    if (extracted) {
      base64Data = extracted.data;
    }

    console.log('Uploading image, base64 length:', base64Data.length);

    const result = await uploadToImgBB(base64Data);

    console.log('ImgBB result:', result);

    if (result.code === 200) {
      return res.json({
        code: 200,
        data: {
          url: result.data.url,
          display_url: result.data.display_url
        },
        msg: '上传成功'
      });
    } else {
      return res.status(500).json({ code: 500, data: null, msg: result.msg || '上传失败' });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ code: 500, data: null, msg: '服务器内部错误' });
  }
});

export default router;
