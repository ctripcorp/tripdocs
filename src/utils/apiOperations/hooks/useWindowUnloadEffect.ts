import { useEffect, useRef } from 'react';

export const useWindowUnloadEffect = (handler: any, callOnCleanup: any) => {
  const cb: any = useRef();

  cb.current = handler;

  useEffect(() => {
    const handler: any = () => cb.current();

    window.addEventListener('beforeunload', handler);

    return () => {
      if (callOnCleanup) handler();

      window.removeEventListener('beforeunload', handler);
    };
  }, [cb]);
};
