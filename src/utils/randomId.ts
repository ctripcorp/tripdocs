import { v4 as anchorId } from 'uuid';

export function createRandomId() {
  return anchorId() + '_' + new Date().getTime().toString(32);
}

export function createUUID() {
  return anchorId();
}
