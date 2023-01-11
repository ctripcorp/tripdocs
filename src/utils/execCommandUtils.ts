export const execCopy = async data_to_copy => {
  const permit = await navigator.permissions.query({ name: 'clipboard-read' } as any);
  if (!navigator.clipboard || !permit) {
    document.execCommand('copy');
  } else {
    navigator.clipboard
      .write(data_to_copy)
      .then(function () {
        console.log('[execCopy] copied!');
      })
      .catch(function () {
        console.error('[execCopy] error');
      });
  }
};
