export const getPaginationValues = (pageString?: string, pageSize = 10) => {
  let page = pageString ? parseInt(pageString) : 1;
  page = isNaN(page) || page <= 0 ? 1 : page;
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageSize,
    offset,
  };
};
