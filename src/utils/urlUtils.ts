export function getUrlQuery(uname) {
  let name = uname + '=';
  let queryStr = window.location.href.split('?');
  queryStr.shift();
  if (!queryStr.length) {
    return '';
  }
  let ca = queryStr[0].split('&');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
  }
  return '';
}
