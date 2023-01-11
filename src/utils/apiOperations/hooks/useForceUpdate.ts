import { useState } from 'react';

export function useForceUpdate() {
  const [value, setValue] = useState(0);
  return { dep: value, trigger: () => setValue(value => value + 1) };
}
