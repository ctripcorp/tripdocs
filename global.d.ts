/*
 * @Author: your name
 * @Date: 2021-09-27 16:00:38
 * @LastEditTime: 2022-09-28 10:29:12
 * @LastEditors: pym
 * @Description: In User Settings Edit
 * @FilePath: /tripdocs-js-sdk/global.d.ts
 */

declare module '@src/*';
declare module '@utils/*';
declare module 'direction';

interface Options {
  showTopMenuOnlyRead: boolean;
  allUserListFilter: any;
  reloadCallback: Function;
  fallbackCallback: () => void;
  joinDevGroup?: Function;
  openModalParam: any;
  historyVersionShortKey: boolean;
  defaultTitle: any;
  isRefresh?: boolean;
  defaultUserList: any;
  titleCallback: Function;
  banCommentNesting: any;
  openAutoRecover: boolean;
  spellcheck: any;
  isInElectron: boolean;
  isInternet?: boolean;
  useIMEInput: boolean;
  openRrweb: boolean;
  kickedOut: boolean;
  useTripdocsFileUpload: boolean;
  safeAreaBottom: number;
  isWideMode: any;
  lang?: 'zh' | 'en';
  useValidationWorker?: boolean;
  md2SlateContent: any[];
  errorRecoverCallback?: Function;
  mdContent?: string;
  mdRefreshDocCallback?: Function;
  commentRanges: any;
  Transforms: any;
  socket: { provider: any };
  commentData: any;
  SlateEditor: any;
  ReactEditor: any;
  cache: { textValue: string; docContentQueue: { docContent: any; at: string }[]; commentId: string; timeCheck: boolean };
  props: Options;
  api: any;
  editor?: any;
  isMdEditor: any;
  allUserList: any;
  docId: string;
  toolbar: string[];
  readOnly: boolean;
  tocPlacement: 'left' | 'right';
  deepestDisplayAnchorHeading: 3 | 4 | 5 | 6;
  fake: boolean;
  docToken: string;
  identityauth2: string;
  socketUrl: string;
  secure: boolean;
  /* Callbacks */
  onSlateChange: Function;
  mentionCallback: Function;
  roomUsersCallback: Function;
  commentCallback: Function;
  shareCallback: Function;
  initCallback: Function;
  docStatusCallback: Function;
  getUserList: Function;
  linkClickCallBack: Function;
  getDocHistoryCallback: Function;
  getDocBlobByVersionCallback: Function;
  restoreDocCallback: Function;
  getDocToken: Function;
  defaultValue: any[];
  defaultValue2: string;
  defaultMDValue: string;
  showHoveringCommentButton: boolean;
  showGlobalComment: boolean;
  showHelpBlock: boolean;
  cssTarget: string;
  defaultCommentData: any[];
  userInfo: {
    userId?: number;
    city?: string;
    department?: string;
    company?: string;
    employee: string;
    mail?: string;
    memberOf?: string;
    displayName?: string;
    distinguishedName?: string;
    userName: string;
    sn?: string;
    tag?: string;
  };
}
lang: any;
interface Tripdocs {
  rrwebRecord: { upload: Function };
  lang: any;
  cache: any;
  cacheElement?: {
    img: HTMLImageElement;
    canvas: HTMLCanvasElement;
  };
  editorsMap?: {
    [key: string]: Options;
  };
  Editor: any;
}
interface Window {
  tripdocs: Tripdocs;
  ctxBridge: any;
  env?: string;
  __DEV__: string;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare var $_bf;
