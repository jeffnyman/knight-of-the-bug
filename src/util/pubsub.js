// A minimal publish/subscribe bus. Subscribers are either plain functions
// or objects with a handleMessage method. Both receive the message name,
// the publisher, and an optional data payload.
const storage = Object.create(null);

export function publish(message, publisher, data) {
  let subscribers = storage[message] || [];

  // Iterate over a copy so a subscriber can unsubscribe itself mid-publish
  // without skipping its neighbours.
  subscribers.slice().forEach((subscriber) => {
    if (typeof subscriber == "function") {
      subscriber(message, publisher, data);
    } else {
      subscriber.handleMessage(message, publisher, data);
    }
  });
}

export function subscribe(message, subscriber) {
  if (!(message in storage)) {
    storage[message] = [];
  }

  storage[message].push(subscriber);
}

export function unsubscribe(message, subscriber) {
  let subscribers = storage[message] || [];
  let index = subscribers.indexOf(subscriber);

  if (index > -1) {
    subscribers.splice(index, 1);
  }
}
