import storage from '../utils/storage';
export function getCookie(cname) {
  const val = storage.get(cname);

  if (!getMyCookie(cname)) {
    delMyCookie(cname);
    setMyCookie(cname, val, 30);
  }

  return val;
}
export function setCookie(cname, val, expire = 30) {
  storage.set(cname, val, expire * 24 * 60 * 60);
  delMyCookie(cname);
  setMyCookie(cname, val, expire);
}
export function getMyCookie(cname) {
  let name = cname + '=';
  let ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i].trim();
    if (c.indexOf(name) == 0) {
      const val = c.substring(name.length, c.length);

      return val;
    }
  }

  return '';
}

export function setMyCookie(c_name, value, expire_days) {
  let exDate = new Date();
  exDate.setDate(exDate.getDate() + expire_days);
  document.cookie = c_name + '=' + encodeURIComponent(value) + ';expires=' + exDate.toUTCString() + ';path=/';
}
export function delMyCookie(c_name, value = '') {
  let exDate = new Date();
  exDate.setDate(exDate.getDate() - 1);
  document.cookie = c_name + '=' + encodeURIComponent(value) + ';expires=' + exDate.toUTCString() + ';path=/';
  document.cookie = c_name + '=' + encodeURIComponent(value) + ';expires=' + exDate.toUTCString() + ';path=/tripdocs';
  document.cookie = c_name + '=' + encodeURIComponent(value) + ';expires=' + exDate.toUTCString() + ';path=/tripdocs/docs/slatedocs';
  document.cookie = c_name + '=' + encodeURIComponent(value) + ';expires=' + exDate.toUTCString() + ';path=/tripdocs/docs';
}
