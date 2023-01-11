export function throttle(fn: Function, wait?: number) {
  wait = wait || 300;
  let lastTime = 0;
  return function () {
    let _self = this;
    let _args = arguments;
    let nowTime = new Date().getTime();
    if (nowTime - lastTime > wait) {
      fn.apply(_self, _args);
      lastTime = nowTime;
    }
  };
}
