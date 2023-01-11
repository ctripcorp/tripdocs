import { useEffect, useState } from 'react';

function getCurrentLocation() {
  return {
    pathname: window.location.pathname,
    search: window.location.search,
  };
}

const listeners: { (): void; (): void }[] = [];

export function notify() {
  listeners.forEach(listener => listener());
}

export function useLocation() {
  const [{ pathname, search }, setLocation] = useState(getCurrentLocation());

  useEffect(() => {
    window.addEventListener('popstate', handleChange);
    return () => window.removeEventListener('popstate', handleChange);
  }, []);

  useEffect(() => {
    listeners.push(handleChange);
    return () => {
      listeners.splice(listeners.indexOf(handleChange), 1);
    };
  }, []);

  function handleChange() {
    setLocation(getCurrentLocation());
  }

  function push(url: string) {
    window.history.pushState(null, null, url);
    notify();
  }

  function replace(url: string) {
    window.history.replaceState(null, null, url);
    notify();
  }

  return {
    push,
    replace,
    pathname,
    search,
  };
}
