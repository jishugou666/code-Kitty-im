export function success(data = null, msg = 'Success') {
  return {
    code: 200,
    data,
    msg
  };
}

export function error(msg = 'Error', code = 500, data = null) {
  return {
    code,
    data,
    msg
  };
}

export function unauthorized(msg = 'Unauthorized') {
  return {
    code: 401,
    data: null,
    msg
  };
}

export function forbidden(msg = 'Forbidden') {
  return {
    code: 403,
    data: null,
    msg
  };
}

export function notFound(msg = 'Not Found') {
  return {
    code: 404,
    data: null,
    msg
  };
}

export function validationError(msg = 'Validation Error') {
  return {
    code: 400,
    data: null,
    msg
  };
}
