import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadToImgBB, extractBase64FromDataURL } from '../utils/imgbb.js';

const router = Router();

router.post('/image', authMiddleware, async (req, res, next) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.json({ code: 400, data: null, msg: '请提供图片数据' });
    }

    let base64Data = image;
    const extracted = extractBase64FromDataURL(image);
    if (extracted) {
      base64Data = extracted.data;
    }

    const result = await uploadToImgBB(base64Data);

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
      return res.json({ code: result.code, data: null, msg: result.msg });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.json({ code: 500, data: null, msg: '上传失败' });
  }
});

export default router;
