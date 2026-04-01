export const sendError = (res, status, message) =>
  res.status(status).json({ success: false, message });

export const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, ...data });
