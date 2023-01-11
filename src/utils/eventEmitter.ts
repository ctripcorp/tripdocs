export default class EventEmitter {
  docId: string | number;
  events: {};
  constructor(docId: string | number) {
    this.docId = docId;
    this.events = {};
  }

  on(type, listener, docId, isUnshift = false) {
    if (this.docId !== docId) return;
    if (!this.events) {
      this.events = {};
    }
    if (this.events[type]) {
      if (isUnshift) {
        this.events[type].unshift(listener);
      } else {
        this.events[type].push(listener);
      }
    } else {
      this.events[type] = [listener];
    }
  }

  emit(type, docId, ...args) {
    if (this.docId !== docId) return;
    if (this.events[type]) {
      this.events[type].forEach(fn => fn.call(this, ...args));
    }
  }

  once(type, docId, listener) {
    if (this.docId !== docId) return;
    const me = this;
    function oneTime(...args) {
      listener.call(this, ...args);
      me.off(type, docId, oneTime);
    }
    me.on(type, docId, oneTime);
  }

  off(type, listener, docId) {
    if (this.docId !== docId) return;
    if (this.events[type]) {
      const index = this.events[type].indexOf(listener);
      this.events[type].splice(index, 1);
    }
  }
}
