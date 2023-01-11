import { useState, useEffect } from 'react';

export default function useVisualViewport() {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => {
      if (!window.visualViewport) return;
      window.visualViewport && setViewport({ width: window.visualViewport.width, height: window.visualViewport.height });
    };
    window.visualViewport && window.visualViewport.addEventListener('resize', handler);
    window.visualViewport && window.visualViewport.addEventListener('scroll', handler);
    return () => {
      window.visualViewport && window.visualViewport.removeEventListener('resize', handler);
      window.visualViewport && window.visualViewport.removeEventListener('scroll', handler);
    };
  }, []);
  return viewport;
}
