import { useEffect, useState } from "react";

const useRevealAnimation = (delay = 0) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let frameId;
    let timeoutId;

    if (delay > 0) {
      timeoutId = setTimeout(() => {
        frameId = requestAnimationFrame(() => setIsVisible(true));
      }, delay);
    } else {
      frameId = requestAnimationFrame(() => setIsVisible(true));
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delay]);

  return isVisible;
};

export default useRevealAnimation;
