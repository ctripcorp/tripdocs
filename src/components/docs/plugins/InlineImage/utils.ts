import isUrl from 'is-url';

export function getLocationPureUrl() {
  if (typeof location === 'object') {
    const url = '//' + location.host + '/';

    return url;
  }
  return '//localhost:5389/';
}

export function judgeIsPrivate(url: string | ArrayBuffer, isReadOnly: boolean = false) {
  if (typeof url === 'string' && url.replace(/http:|https:/, '').indexOf(getLocationPureUrl()) === 0) {
    return true;
  }
  if (isReadOnly && typeof url === 'string' && (isImageBase64(url) || isUrl(url))) {
    return true;
  }

  return false;
}

export function isImageBase64(text: string) {
  return text.indexOf('data:image/') === 0;
}

export function execUrl(url: string | ArrayBuffer) {
  let nUrl: string | ArrayBuffer = '';

  if (typeof url === 'string') {
    nUrl = url.trim();

    if (url.indexOf('//localhost') != -1 && typeof location !== 'undefined') {
      nUrl = url.replace('//localhost', '//' + location.hostname);
    }
  } else {
    nUrl = url;
  }
  return nUrl;
}
