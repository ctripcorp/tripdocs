function quikSlice(array: any[] | string, start: number, end?: number) {
  if (end !== undefined && start > end && end >= 0) {
    return array.slice(end, start);
  } else {
    return array.slice(start, end);
  }
}
export { quikSlice };
