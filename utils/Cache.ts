interface CacheObject<T> {
  data: T;
  expires: number;
}

export default class Cache<T> {
  cache = new Map<string, CacheObject<T>>();

  getCache(key: string) {
    const _cache = this.cache.get(key);

    if (_cache && _cache.data && _cache.expires > Date.now()) {
      console.log('cache');
      return _cache.data;
    }

    return null;
  }

  setCache(key: string, value: any) {
    const expires = Date.now() + 15 * 60 * 1000; // 15 minutes
    this.cache.set(key, { data: value, expires });
  }
}
