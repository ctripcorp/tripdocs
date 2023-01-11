import { Editor } from '@src/components/slate-packages/slate';
import hash from 'object-hash';

let lastNormalizeTag = '';

// 注册验证 editor.children 结构的 worker
export const registerValidationWorker = editor => {
  if (!editor || !editor.children) return;
  const { children } = editor;
  if (window.Worker) {
    try {
      /** using blob, the calculated file */
      /** deprecated: 将测试好的 validation.worker.js 的内容放在 Blob 的 code 内容中 */
      const code = `const ELTYPE = {
    CODE_BLOCK: "code-block",
    TODO_LIST: "todo-list",
    IMAGE: "image",
    INLINEIMAGE: "inline-image",
    FILE: "file",
    VIDEO: "video",
    MENTION: "mention",
    BLOCK_QUOTE: "block-quote",
    PARAGRAPH: "paragraph",
    HEADING_SIX: "heading-six",
    HEADING_FIVE: "heading-five",
    HEADING_FOUR: "heading-four",
    HEADING_THREE: "heading-three",
    HEADING_TWO: "heading-two",
    HEADING_ONE: "heading-one",
    OLLIST: "numbered-list",
    ULLIST: "bulleted-list",
    LINK: "edit-link",
    TABLE: "table",
    TABLE_ROW: "table-row",
    TABLE_CELL: "table-cell",
    DIVIDE: "hr",
    CARD: "card",
    CARD_PRE: "card-pre",
    CARD_SUF: "card-suf",
    ALERTS: "alerts",
    ALERTMESSAGE: "alertmessage",
    ALERTDESCRIPTION: "alertdescription",
    EXCALIDRAW: "excalidraw"
};

const TEXT_ELEMENT_TYPES = [ ELTYPE.ALERTMESSAGE, ELTYPE.ALERTDESCRIPTION, ELTYPE.BLOCK_QUOTE, ELTYPE.HEADING_SIX, ELTYPE.HEADING_FIVE, ELTYPE.HEADING_FOUR, ELTYPE.HEADING_THREE, ELTYPE.HEADING_TWO, ELTYPE.HEADING_ONE, ELTYPE.OLLIST, ELTYPE.PARAGRAPH, ELTYPE.TODO_LIST, ELTYPE.ULLIST ];

const INLINE_TYPES = [ ELTYPE.MENTION, ELTYPE.LINK, ELTYPE.INLINEIMAGE ];

const inCardEL = [ ELTYPE.DIVIDE, ELTYPE.TABLE, ELTYPE.IMAGE, ELTYPE.ALERTS, ELTYPE.CODE_BLOCK, ELTYPE.VIDEO, ELTYPE.EXCALIDRAW, ELTYPE.FILE ];

function validateDocContent(docContent) {
    if (!docContent) {
        throw new Error("docContent is required");
    }
    const valid = {
        value: true,
        invalidNode: null
    };
    if (docContent.length < 2) {
        valid.value = false;
        return valid;
    }
    for (let i = 0; i < docContent.length; i++) {
        const docContentItem = docContent[i];
        if (!docContentItem.type) {
            valid.value = false;
            return valid;
        }
        if (i === 0 && (docContentItem.type !== ELTYPE.HEADING_ONE || docContentItem.children.length !== 1)) {
            valid.invalidNode = docContentItem;
            valid.value = false;
            return valid;
        }
        if (INLINE_TYPES.includes(docContentItem.type)) {
            valid.invalidNode = docContentItem;
            valid.value = false;
            return valid;
        }
        recValidate(docContentItem, valid);
        if (!valid.value) {
            console.info("[invalid docContent] validateDocContent", JSON.stringify(docContentItem), JSON.stringify(valid));
            return valid;
        }
    }
    return valid;
}

function negate(valid, root) {
    valid.value = false;
    valid.invalidNode = root;
}

function recValidate(root, valid) {
    if (!root || !valid.value) {
        return;
    }
    if (root.type) {
        const {
            children,
            type
        } = root;
        if (!children) {
            return;
        }
        if (Object.values(ELTYPE).includes(root.type) && children.length === 0) {
            negate(valid, root);
            return;
        }
        switch (type) {
          case ELTYPE.ALERTMESSAGE:
          case ELTYPE.ALERTDESCRIPTION:
          case ELTYPE.BLOCK_QUOTE:
          case ELTYPE.HEADING_SIX:
          case ELTYPE.HEADING_FIVE:
          case ELTYPE.HEADING_FOUR:
          case ELTYPE.HEADING_THREE:
          case ELTYPE.HEADING_TWO:
          case ELTYPE.HEADING_ONE:
          case ELTYPE.OLLIST:
          case ELTYPE.PARAGRAPH:
          case ELTYPE.TODO_LIST:
          case ELTYPE.ULLIST:
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                const isPlainText = typeof child.type === "undefined" && typeof child.text === "string";
                if (!isPlainText && ![ ...INLINE_TYPES ].includes(child.type)) {}
            }
            break;

          case ELTYPE.TABLE:
            const validTable = children.every(child => child.type === ELTYPE.TABLE_ROW);
            if (!(typeof root.row === "number" && children.length === root.row && validTable)) {}
            break;

          case ELTYPE.TABLE_ROW:
            const validTableRow = children.every(child => child.type === ELTYPE.TABLE_CELL);
            if (!validTableRow) {}
            break;

          case ELTYPE.TABLE_CELL:
            const validTableCell = children.every(child => [ ...TEXT_ELEMENT_TYPES, ELTYPE.CARD ].includes(child.type));
            if (!validTableCell) {}
            break;

          case ELTYPE.ALERTS:
            const validAlerts = children.every(child => [ ELTYPE.ALERTMESSAGE, ELTYPE.ALERTDESCRIPTION ].includes(child.type));
            if (!validAlerts) {}
            break;

          case ELTYPE.FILE:
            if (!(children.length === 1 && typeof children[0].text === "string")) {}
            break;

          case ELTYPE.EXCALIDRAW:
            break;

          case ELTYPE.CODE_BLOCK:
          case ELTYPE.IMAGE:
          case ELTYPE.VIDEO:
          case ELTYPE.DIVIDE:
          case ELTYPE.CARD_PRE:
          case ELTYPE.CARD_SUF:
          case ELTYPE.MENTION:
          case ELTYPE.INLINEIMAGE:
            if (!(children.length === 1 && typeof children[0].text === "string" && children[0].text.length === 0)) {}
            break;

          case ELTYPE.CARD:
            if (children.length !== 3) {
                negate(valid, root);
                break;
            }
            if (!(children[0].type === ELTYPE.CARD_PRE && inCardEL.includes(children[1].type) && children[2].type === ELTYPE.CARD_SUF)) {
                negate(valid, root);
                break;
            }
            break;

          case "inlineImage":
            negate(valid, root);
            break;

          case ELTYPE.LINK:
            const hasElement = children.some(child => !!child.type);
            if (hasElement) {
                negate(valid, root);
                break;
            }

          default:
            break;
        }
    }
    if (root.children && Array.isArray(root.children)) {
        root.children.forEach(item => {
            recValidate(item, valid);
        });
    }
}

let port2 = null;

self.addEventListener("message", initPort);

function initPort(event) {
    console.log("[worker] initPort", event);
    port2 = event.ports[0];
    port2.onmessage = onMessage;
}

function onMessage(e) {
    if (!e || !e.data || !e.data.docContent) {
        return;
    }
    const {
        docContent
    } = e.data;
    const docContentObject = JSON.parse(docContent);
    const valid = validateDocContent(docContentObject);
    var workerResult = {
        isValid: valid.value,
        invalidNode: valid.invalidNode,
        docContent: docContentObject
    };
    port2.postMessage(workerResult);
}`;
      let blob = new Blob([code]);
      // Obtain a blob URL reference to our worker 'file'.
      let blobURL = window.URL.createObjectURL(blob);

      const worker = new Worker(blobURL);

      if (worker && children) {
        // const sab = new SharedArrayBuffer(1024); // > 10MB 的文档内容需要通过 SharedArrayBuffer 来传递
        // worker.postMessage(sab);
        const messageChannel = new MessageChannel();
        // （内存层面上）转移 port2 到 worker
        worker.postMessage('init port2', [messageChannel.port2]);

        // 在 port1 发送消息
        messageChannel.port1.postMessage({
          docContent: JSON.stringify(children),
        });

        // 在 port1 上接收消息
        messageChannel.port1.onmessage = function (event) {
          const { data } = event;
          // console.log('[worker] messageChannel.port1.onmessage', event, event.data);
          if (data) {
            if (data.isValid) {
              console.log('[worker out] VALID content');
            } else {
              console.log('[worker out] INVALID content, at node:', data.invalidNode, data);
              console.log('[worker end] Trying to normalize content');

              const normalizeTag = hash(data);
              console.log('[worker out] normalizeTag:', normalizeTag, data);
              if (lastNormalizeTag === normalizeTag) {
                console.log('[worker end] Already normalized, but still invalid');
              } else {
                Editor.normalize(editor, { force: true });
                lastNormalizeTag = normalizeTag;
              }
            }
          }
        };

        messageChannel.port1.onmessageerror = function (event) {
          console.log('[worker] messageChannel.port1.onmessageerror', event);
        };

        return { worker, blobURL };
      }
    } catch (error) {
      console.error(`Registration failed with ${error}`);
    }
  }
};
