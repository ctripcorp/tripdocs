let _cache = {};

function init() {
  const MAX_MEMORTY_VALUE_LENGTH = 300;
  let _store = window ? window.localStorage : null;
  let _prefix = `tripdocs/`;
  let storage;

  try {
    _store.setItem('bs_:)_', '__');
    _store.removeItem('bs_:)_');
  } catch (e) {
    _store = null;
  }

  if (_store) {
    storage = {
      sync(products, fn) {
        let lastPrefix = _prefix;
        products.forEach(product => {
          _prefix = `__ta/${product}_`;
          fn();
        });
        _prefix = lastPrefix;
      },
      set(key, val, seconds) {
        let expiredAt = seconds ? Date.now() + seconds * 1000 : 0;
        val = JSON.stringify([val, expiredAt]);
        if (val.length <= MAX_MEMORTY_VALUE_LENGTH) _cache[key] = val;
        else delete _cache[key];
        _store.setItem(_prefix + key, val);
      },

      setAll(map) {
        Object.keys(map).forEach(key => {
          this.set(key, map[key]);
        });
      },

      get(key, defaultValue) {
        let rawVal = _cache[key] || _store.getItem(_prefix + key);
        if (!rawVal) return defaultValue;

        try {
          let [val, expiredAt] = JSON.parse(rawVal);
          if (expiredAt && Date.now() > expiredAt) {
            return defaultValue;
          }
          return val;
        } catch (e) {
          return defaultValue;
        }
      },

      del(key) {
        delete _cache[key];
        _store.removeItem(_prefix + key);
      },

      has(key) {
        return key in _cache || !!_store.getItem(_prefix + key);
      },
    };
  } else {
    storage = singleStorage();
  }
  return storage;
}
let storage: any;
if (!storage) {
  if (typeof window === 'object') {
    storage = init();
  } else {
    storage = singleStorage();
  }
}
function singleStorage() {
  return {
    set(key, val) {
      _cache[key] = val;
    },
    get(key) {
      return _cache[key];
    },
    del(key) {
      delete _cache[key];
    },
    has(key) {
      return key in _cache;
    },
  };
}

export { storage as default };
