import ReactDOM from 'react-dom';

interface ElementProps {
  children: any;
  [key: string]: any;
}
export const Portal = (props: ElementProps) => {
  const { children, editorId } = props;
  const container = document.getElementById(editorId)?.parentElement;
  if (!container) return null;
  return ReactDOM.createPortal(children, container);
};
export const EditorContainerOuterPortal = ({ children, docId }: any) => {
  const editorEl: any = document.getElementById(`editorarea-${docId}`)?.parentElement?.parentElement?.parentElement;
  return ReactDOM.createPortal(children, editorEl);
};

export const OverlayContainerRelativePortal = ({ children, docId }: any) => {
  const containerEl: any = document.getElementById(`overlayContainer-relative-${docId}`);
  if (!containerEl) {
    return null;
  }
  return ReactDOM.createPortal(children, containerEl);
};
export const editorContainerOuterPortalFun = ({ children, docId }: any) => {
  const editorEl: any = document.getElementById(`editorarea-${docId}`)?.parentElement?.parentElement?.parentElement;
  return ReactDOM.createPortal(children, editorEl);
};
export const EditorContainerPortal = ({ children, docId }: any) => {
  const editorEl: any = document.getElementById(`editorarea-${docId}`)?.parentElement?.parentElement;
  return ReactDOM.createPortal(children, editorEl);
};

export const EditorContainerInnerPortal = ({ children, docId }: any) => {
  const editorEl: any = document.getElementById(`editorarea-${docId}`)?.parentElement;
  return ReactDOM.createPortal(children, editorEl);
};

export const EditorContainerBottomPortal = ({ children, docId }: any) => {
  const containerEl: any = document.getElementById(`editorContainerBottom-${docId}`);
  if (!containerEl) {
    return null;
  }
  return ReactDOM.createPortal(children, containerEl);
};
