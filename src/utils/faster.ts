export function getItemFromArrByKeyValue(array, key, value) {
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item && item[key].toString() === value.toString()) {
      return item;
    }
  }
  return;
}

export function getArrayFromArrByKeyValue(array, key, val) {
  const newArr = [];
  for (let i = 0; i < array.length; i++) {
    const item = array[i];
    if (item && Array.isArray(key)) {
      let value = item;
      let isGo = true;
      for (let i = 0; i < key.length; i++) {
        const cKey = key[i];
        if (value && value[cKey]) {
          value = value[cKey];
        } else {
          isGo = false;
          break;
        }
      }
      if (isGo && val && value.toString() === val.toString()) {
        newArr.push(item);
      }
    } else if (item && val && item[key].toString() === val.toString()) {
      newArr.push(item);
    }
  }
  return newArr;
}

export function getArrFromArrByKey(array, key) {
  return array.map(it => {
    if (typeof it === 'string') {
      return it;
    }
    return it[key];
  });
}
export function getStrArrFromArrByKey(array, key) {
  return array.map(it => {
    return it[key].toString();
  });
}

export function transformObjStrTimeToNumAndCallback(obj: any, callback) {
  if (obj?.time && typeof obj.time === 'string') {
    const time = new Date(obj.time).getTime();
    if (!isNaN(time)) {
      obj = {
        ...obj,
        time,
      };
    } else {
      console.error('data transform err:\n', { obj });
    }
  }
  callback(obj);
}
