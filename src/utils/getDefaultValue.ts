import * as Y from 'yjs';

export function getDefaultValueByBase64(base64: string) {
  const state2 = _base64ToArrayBuffer(base64);
  const ydoc1 = new Y.Doc();
  Y.applyUpdate(ydoc1, state2);
  const defaultValue = ydoc1.getArray('content').toJSON();
  console.log('options.defaultValue', defaultValue);
  return defaultValue;
}
function _base64ToArrayBuffer(base64) {
  let binary_string = window.atob(base64);
  let len = binary_string.length;
  let bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}
