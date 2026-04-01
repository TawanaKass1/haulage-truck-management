export const getPagination = (query) => {
  const page = Math.max(parseInt(query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(query.limit || "10", 10), 1), 50);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const getMeta = (page, limit, total) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit)
});
