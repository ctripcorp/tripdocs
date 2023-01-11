export function hashCode(str: string) {
  if (!str) {
    console.error('请传入一个字符串进行哈希化，现在拿到的是：' + str);
  }
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function intToRGB(i: number) {
  let c = (i & 0x00ffffff).toString(16).toUpperCase();
  return '00000'.substring(0, 6 - c.length) + c;
}

export function isRGBLight(rgb: string) {
  let matchColors = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
  let match = matchColors.exec(rgb);
  if (match !== null) {
    let [_, r, g, b] = match;
    const brightness = (parseInt(r) * 299 + parseInt(g) * 587 + parseInt(b) * 114) / 1000;
    return brightness > 155;
  } else {
    return false;
  }
}
