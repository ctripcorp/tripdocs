const cut = (editor: any) => {
  document.execCommand('cut');
};

const copy = (editor: any) => {
  document.execCommand('copy');
};

const paste = async (editor: any) => {
  const res = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
  if (res.state == 'granted' || res.state == 'prompt') {
    const data = await (navigator.clipboard as any).read();
    for (const c of data) {
      const blob = await c.getType('text/html');
      const data = await blob.text();
      let dt = new DataTransfer();
      dt.setData('text/html', data);
      editor.insertData(dt);
    }
  }
};

export const rightClickMenuActions = (editor: any, action: any) => {
  switch (action) {
    case 'cut':
      return cut(editor);
    case 'copy':
      return copy(editor);
    case 'paste':
      return paste(editor);
    default:
      break;
  }
};
