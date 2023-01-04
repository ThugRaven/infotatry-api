export const getPaginationValues = (page = 1, pageSize = 10) => {
  page = page <= 0 ? 1 : page;
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
  };
};
