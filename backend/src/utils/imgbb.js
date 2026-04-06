const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '2c62307c13e33467f1567c4dc26f72b7';

export async function uploadToImgBB(base64Data) {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', base64Data);

    const response = await fetch(IMGBB_API_URL, {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success && data.data && data.data.url) {
      return {
        code: 200,
        data: {
          url: data.data.url,
          display_url: data.data.display_url || data.data.url,
          delete_url: data.data.delete_url,
          expiration: data.data.expiration
        },
        msg: '上传成功'
      };
    } else {
      console.error('ImgBB upload failed:', data);
      return {
        code: 500,
        data: null,
        msg: data.error?.message || '上传失败'
      };
    }
  } catch (error) {
    console.error('ImgBB upload error:', error);
    return {
      code: 500,
      data: null,
      msg: '上传服务异常'
    };
  }
}

export function extractBase64FromDataURL(dataURL) {
  if (!dataURL) return null;
  const matches = dataURL.match(/^data:([^;]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mime: matches[1],
      data: matches[2]
    };
  }
  return null;
}
