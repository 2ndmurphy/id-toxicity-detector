import { TweetBuffer, ApiRespone } from "./sharedTypes";

interface Tweet {
  tweetElement: HTMLDivElement;
  tweetText: string;
}

let isObserving = false;
let observer: MutationObserver | null = null;

let loadedTweets = new Map<number, Tweet>();
let toxicTweetElements: HTMLDivElement[] = [];
let newTweetsBuffer: TweetBuffer[] = [];

let currentTweetIds = 0;

let lastApiCallTime = Date.now();

function processEmojiToByteSequence(emoji: string): string {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(emoji);
  let hexString = "";
  for (const byte of encoded) {
    hexString += "\\x" + byte.toString(16).padStart(2, "0");
  }
  return hexString;
}

function processTweetText(text: string): string {
  return text
    .toLowerCase()
    .replace(/@\w+/g, "USER") // Replace @user mentions with USER
    .replace(/https?:\/\/[^\s]+/g, "HTTPURL") // Replace URLs with HTTPURL
    .trim();
}

function scrapeTweets(): Map<number, Tweet> {
  const currentTweets = new Map<number, Tweet>();

  const tweetDivs = document.querySelectorAll(
    "div[data-testid='tweetText']"
  ) as NodeListOf<HTMLDivElement>;

  for (const tweetDiv of tweetDivs) {
    let tweetText = "";

    for (const element of tweetDiv.children) {
      switch (element.tagName) {
        case "SPAN":
          tweetText += (element as HTMLSpanElement).textContent || "";
          break;
        case "IMG":
          const emoji = (element as HTMLImageElement).alt || "";
          tweetText += processEmojiToByteSequence(emoji);
          break;
        default:
          tweetText += element.textContent || "";
          break;
      }
    }

    currentTweetIds++;

    currentTweets.set(currentTweetIds, {
      tweetElement: tweetDiv,
      tweetText: processTweetText(tweetText),
    });
  }

  return currentTweets;
}

function waitForTweetContainer(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const container = document.querySelector(
        "main[role='main']"
      ) as HTMLElement;
      if (container) {
        clearInterval(interval);
        resolve(container);
      }
    }, 100);
  });
}

function resetLoadedTweets() {
  console.log("Resetting tweets...");
  loadedTweets.clear();
}

function handleNewTweets(newTweetsMap: Map<number, Tweet>) {
  newTweetsMap.forEach((tweet, id) => {
    let isNewTweet = true;
    for (const existingTweet of loadedTweets.values()) {
      if (existingTweet.tweetText === tweet.tweetText) {
        isNewTweet = false;
        break;
      }
    }

    if (isNewTweet) {
      loadedTweets.set(id, tweet);
      newTweetsBuffer.push({ id: id, tweetText: tweet.tweetText });
      console.log("New Tweet Added:", { id, tweetText: tweet.tweetText });
      console.log(loadedTweets);
    }
  });
}

function sendTweetsBufferToApi() {
  setInterval(() => {
    const now = Date.now();
    if (newTweetsBuffer.length > 0 && now - lastApiCallTime >= 5000) {
      chrome.runtime.sendMessage({
        action: "processTweets",
        tweets: newTweetsBuffer,
      });
      console.log("Sending to service worker:", newTweetsBuffer);
      newTweetsBuffer = [];
      lastApiCallTime = now;
    }
  }, 1000);
}

async function startObservingTweets() {
  if (isObserving) return;
  isObserving = true;

  const tweetContainer = await waitForTweetContainer();
  if (!tweetContainer) {
    console.error("Tweet container not found!");
    return;
  }
  console.log("Tweet container found. Setting up MutationObserver...");

  const initialTweets = scrapeTweets();
  handleNewTweets(initialTweets);

  tweetContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("article")) {
      resetLoadedTweets();
    }
  });
  window.addEventListener("popstate", resetLoadedTweets);

  observer = new MutationObserver(() => {
    const newTweets = scrapeTweets();
    handleNewTweets(newTweets);
  });

  observer.observe(tweetContainer, { childList: true, subtree: true });
  console.log("Tweet observer started!");

  sendTweetsBufferToApi();
}

function stopObservingTweets() {
  if (observer) {
    observer.disconnect();
    observer = null;
    isObserving = false;
    loadedTweets.clear();
    console.log("Tweet observer stopped.");
  }
}

function highlightToxicTweets() {
  setInterval(() => {
    for (const toxicTweetsElement of toxicTweetElements) {
      toxicTweetsElement.style.border = "1px solid red";
    }

    console.log(toxicTweetElements);
  }, 2000);
}

function processToxicTweet(toxicTweets: ApiRespone[]) {
  if (!toxicTweets || toxicTweets.length === 0) return;

  for (const toxicTweet of toxicTweets) {
    const tweetData = loadedTweets.get(toxicTweet.id);

    if (tweetData && toxicTweet.isToxic) {
      toxicTweetElements.push(tweetData.tweetElement);
      console.log("Highlighted toxic tweet:", toxicTweet.id);
    }
  }
}

chrome.runtime.onMessage.addListener(async (request, sender) => {
  switch (request.action) {
    case "startObserving":
      startObservingTweets();
      break;
    case "stopObserving":
      stopObservingTweets();
      break;
    case "highlightTweets":
      const toxicTweets = request.toxicTweets as ApiRespone[];
      processToxicTweet(toxicTweets);
      highlightToxicTweets();
      break;
  }
});

chrome.runtime.sendMessage({ action: "getInitiateStatus" }, (response) => {
  if (response && response.status) {
    startObservingTweets();
  }
});
