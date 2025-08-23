export const successResponse = (res, { msg = 'Success', data = {} } = {}) => {
  return res.json({
    ok: true,
    msg,
    result: data
  });
};

export const failedResponse = (res, { status = 500, msg } = {}) => {
  return res.status(status).json({
    ok: false,
    msg
  });
};