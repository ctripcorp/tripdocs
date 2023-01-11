export function setCacheCanvasAndImg(): any {
  if (!window.tripdocs.cacheElement) {
    window.tripdocs.cacheElement = {
      canvas: document.createElement('canvas'),
      img: new Image(),
    };
    window.tripdocs.cacheElement.img.crossOrigin = 'Anonymous';
  }
  return window.tripdocs.cacheElement;
}
