function writeStyle(id: string = 'temp-style', originalStyle: string) {
  let oldEl = document.getElementById(id);
  let cssText = originalStyle;
  cssText = cssText.replace(new RegExp('[\n\t\r]', 'ig'), '');

  const style = document.createElement('style');
  style.innerText = cssText;
  style.id = id;
  oldEl ? document.head.replaceChild(style, oldEl) : document.head.appendChild(style);
}
function writeLink(id: string = 'temp-style', url: string) {
  let oldEl = document.getElementById(id);
  const link = document.createElement('link');

  link.setAttribute('rel', 'stylesheet');

  link.setAttribute('type', 'text/css');

  link.href = url;
  link.id = id;
  oldEl ? document.head.replaceChild(link, oldEl) : document.head.appendChild(link);
}
