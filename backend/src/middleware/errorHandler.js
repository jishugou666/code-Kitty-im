export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      data: null,
      msg: err.message || 'Validation Error'
    });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      code: 409,
      data: null,
      msg: 'Duplicate entry'
    });
  }

  res.status(500).json({
    code: 500,
    data: null,
    msg: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
}

export function notFoundHandler(req, res) {
  res.status(404).json({
    code: 404,
    data: null,
    msg: 'Endpoint not found'
  });
}
