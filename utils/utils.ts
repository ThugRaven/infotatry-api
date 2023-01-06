import Cache from './Cache';

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

export const useCacheAndCallApi = async <T>(
  cache: Cache<T>,
  key: string,
  fetch: () => Promise<T>,
) => {
  const _cache = cache.getCache(key);

  if (!_cache) {
    console.log('api');
    const api = await fetch();

    if (!api) {
      return null;
    }

    cache.setCache(key, api);
    return api;
  }

  return _cache;
};
