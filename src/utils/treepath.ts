export function arrangeIntoTree(files: any) {
  let tree: any = [];

  for (let i = 0; i < files.length; i++) {
    let path = files[i].treepath;
    let filename = files[i].directoryId ? '' : files[i].title;
    let currentLevel = tree;
    for (let j = 0; j < path.length; j++) {
      let part = path[j];

      let existingPath = findWhere(currentLevel, 'foldername', part);
      if (existingPath) {
        let existingFile = findWhere(currentLevel, 'filename', filename);
        if (!existingFile && j === path.length - 1) {
          let newFile: any = {
            key: `${path.join('/')}${filename}`,
            foldername: part,
            filename: filename,
            children: [],
          };
          currentLevel.push(newFile);
        }
        currentLevel = existingPath.children;
      } else {
        let newPart: any = {
          key: j === path.length - 1 ? `${path.join('/')}${filename}` : `${path.join('/')}`,
          foldername: part,
          filename: j === path.length - 1 ? filename : '',
          children: [],
        };

        currentLevel.push(newPart);
        currentLevel = newPart.children;
      }
    }
  }
  return tree;

  function findWhere(array: any, key: any, value: any) {
    let t = 0;
    while (t < array.length && array[t][key] !== value) {
      t++;
    }

    if (t < array.length) {
      return array[t];
    } else {
      return false;
    }
  }
}

export function arrangeIntoDirTree(paths: any) {
  let tree: any = [];

  for (let i = 0; i < paths.length; i++) {
    let path = paths[i].treepath;
    let key = paths[i].key;
    let currentLevel = tree;
    for (let j = 0; j < path.length; j++) {
      let part = path[j];

      let existingPath = findWhere(currentLevel, 'title', part);

      if (existingPath) {
        currentLevel = existingPath.children;
      } else {
        let newPart: any = {
          title: part,
          key: j === 0 ? 'root' : path.join('/') + key,
          children: [],
          directoryId: j === 0 ? 'root' : key,
        };

        currentLevel.push(newPart);
        currentLevel = newPart.children;
      }
    }
  }
  return tree;

  function findWhere(array: any, key: any, value: any) {
    let t = 0;
    while (t < array.length && array[t][key] !== value) {
      t++;
    }

    if (t < array.length) {
      return array[t];
    } else {
      return false;
    }
  }
}
