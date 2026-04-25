let requestCount = 0;
let subscribers = [];

export const showLoader = () => {
  requestCount++;
  notifySubscribers();
};

export const hideLoader = () => {
  requestCount = Math.max(0, requestCount - 1);
  notifySubscribers();
};

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback(requestCount > 0));
};

export const subscribeLoader = (callback) => {
  subscribers.push(callback);
  // Send current state immediately on subscribe
  callback(requestCount > 0);
  return () => {
    subscribers = subscribers.filter((cb) => cb !== callback);
  };
};
