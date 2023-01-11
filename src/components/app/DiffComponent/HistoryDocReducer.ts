import produce from 'immer';

type HistoryDocFetch = {
  content: any;
  versionId: string;
  isError: boolean;
  isLoading: boolean;
};

type HistoryDocState = {
  docPrevious: HistoryDocFetch;
  docCurrent: HistoryDocFetch;
  versionList: {
    pageNum: number;
    total: number;
  };
};

enum HistoryDocActionType {
  setPreviousDoc,
  setPreviousError,
  setPreviousLoading,
  setPreviousVersionId,
  setCurrentDoc,
  setCurrentError,
  setCurrentLoading,
  setCurrentVersionId,
  setPageNum,
  setTotal,
}

type HistoryDocAction = {
  type: HistoryDocActionType;
  payload: any;
};

const historyDocStore: HistoryDocState = {
  docPrevious: {
    content: [],
    versionId: '',
    isError: false,
    isLoading: false,
  },
  docCurrent: {
    content: [],
    versionId: '0',
    isError: false,
    isLoading: false,
  },
  versionList: {
    pageNum: 1,
    total: 1,
  },
};

const historyDocReducer = produce((draft: HistoryDocState, action: HistoryDocAction) => {
  switch (action.type) {
    case HistoryDocActionType.setPreviousDoc:
      draft.docPrevious.content = action.payload;
      break;
    case HistoryDocActionType.setCurrentDoc:
      draft.docCurrent.content = action.payload;
      break;
    case HistoryDocActionType.setPreviousError:
      draft.docPrevious.isError = action.payload;
      break;
    case HistoryDocActionType.setCurrentError:
      draft.docCurrent.isError = action.payload;
      break;
    case HistoryDocActionType.setPreviousLoading:
      draft.docPrevious.isLoading = action.payload;
      break;
    case HistoryDocActionType.setCurrentLoading:
      draft.docCurrent.isLoading = action.payload;
      break;
    case HistoryDocActionType.setPreviousVersionId:
      draft.docPrevious.versionId = action.payload;
      break;
    case HistoryDocActionType.setCurrentVersionId:
      draft.docCurrent.versionId = action.payload;
      break;
    case HistoryDocActionType.setPageNum:
      draft.versionList.pageNum = action.payload;
      break;
    case HistoryDocActionType.setTotal:
      draft.versionList.total = action.payload;
      break;
    default:
      break;
  }
});

export { historyDocReducer, historyDocStore, HistoryDocActionType };
export type { HistoryDocAction, HistoryDocState };
