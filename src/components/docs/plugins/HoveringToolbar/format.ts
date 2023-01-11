export const getAllMatchedFormatNames = (node: any, formats: any[]) => {
  const names = Object.getOwnPropertyNames(node);
  let formatArr: any[] = [];
  names.forEach(name => {
    formats.includes(name) && formatArr.push({ [name]: node[name] });
  });
  return formatArr;
};
