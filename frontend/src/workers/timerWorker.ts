let remaining = 0;
let intervalId: ReturnType<typeof setInterval> | null = null;
let lastTick = 0;

self.onmessage = (e: MessageEvent) => {
  const { type, duration } = e.data;

  switch (type) {
    case 'START':
      remaining = duration;
      lastTick = Date.now();
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.round((now - lastTick) / 1000);
        lastTick = now;
        remaining = Math.max(0, remaining - elapsed);
        self.postMessage({ type: 'TICK', remaining });
        if (remaining <= 0) {
          if (intervalId) clearInterval(intervalId);
          intervalId = null;
          self.postMessage({ type: 'TIME_UP' });
        }
      }, 1000);
      break;

    case 'PAUSE':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      break;

    case 'RESUME':
      if (!intervalId && remaining > 0) {
        lastTick = Date.now();
        intervalId = setInterval(() => {
          const now = Date.now();
          const elapsed = Math.round((now - lastTick) / 1000);
          lastTick = now;
          remaining = Math.max(0, remaining - elapsed);
          self.postMessage({ type: 'TICK', remaining });
          if (remaining <= 0) {
            if (intervalId) clearInterval(intervalId);
            intervalId = null;
            self.postMessage({ type: 'TIME_UP' });
          }
        }, 1000);
      }
      break;

    case 'RESET':
      remaining = duration;
      lastTick = Date.now();
      self.postMessage({ type: 'TICK', remaining });
      break;

    case 'STOP':
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      remaining = 0;
      break;
  }
};
