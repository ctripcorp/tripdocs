interface LNodeType {
  element: any;
  next: LNodeType | null;
}

function LNode(element) {
  this.element = element;
  this.next = null;
}
function findPrev(index) {
  if (this.head.next && index < this.length) {
    let tNode = this.head;

    while (index--) {
      tNode = tNode.next;
    }
    return tNode;
  }
  return null;
}

function insert(lNode, index) {
  if (index) {
    let tNode;
    if ((tNode = this.findPrev(index))) {
      lNode.next = tNode.next;
      tNode.next = lNode;
    }
  } else {
    lNode.next = this.head.next;
    this.head.next = lNode;
  }
  this.length++;
}
function remove(index) {
  let lNode;
  if (this.head.next) {
    if (index < this.length) {
      lNode = this.head;

      while (index--) {
        lNode = lNode.next;
      }
      lNode.next = lNode.next.next;
    }
  }
}
function replaceElment(elment, index) {
  let tNode;
  if ((tNode = this.find(index))) {
    tNode.elment = elment;
  }
  return tNode;
}

function find(index) {
  if (this.head.next && index < this.length) {
    let tNode = this.head.next;

    while (index--) {
      tNode = tNode.next;
    }
    return tNode;
  }
  return null;
}

function addNode(tNode: LNodeType, nNode: LNodeType) {
  if (tNode && nNode) {
    nNode.next = tNode.next;
    tNode.next = nNode;
  }
  this.length++;
}

interface LListType {
  insert: Function;
  remove: Function;
  findPrev: Function;
  addNode: Function;
  replaceElment: Function;
  toArray: Function;
  toString: Function;
  find: Function;
  length: number;
  head: LNodeType;
}
export default function LList() {
  this.head = new LNode('head');
  this.find = find;
  this.length = 0;
  this.insert = insert;
  this.remove = remove;
  this.findPrev = findPrev;
  this.replaceElment = replaceElment;
  this.addNode = addNode;
}
LList.prototype.toArray = function (): any[] {
  let tNode = this.head;
  const toStrArr = [];
  let length = this.length;
  while (length--) {
    tNode = tNode.next;

    tNode && toStrArr.push(tNode.element);
  }
  return toStrArr;
};

LList.prototype.toString = function () {
  let tNode = this.head;
  const toStrArr = [];
  let length = this.length;
  while (length--) {
    tNode = tNode.next;

    tNode && toStrArr.push(tNode.element);
  }
  return toStrArr.toString();
};

export { LNode };

export type { LListType, LNodeType };
