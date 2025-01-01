import { unemojify } from 'node-emoji';
import { TweetBuffer, ApiRespone } from "./sharedTypes";

let isObserving = false;
let observer: MutationObserver | null = null;

let loadedTweets = new Map<number, string>();
let toxicTweets: string[] = [];
let newTweetsBuffer: TweetBuffer[] = [];

let currentTweetIds = 0;

let lastApiCallTime = Date.now();

let apiCallIntervalId: number | null = null;
let highlightIntervalId: number | null = null;

function processEmoji(emoji: string): string {
  return unemojify(emoji);
}

function processTweetText(text: string): string {
  return text
    .toLowerCase()
    .replace(/@\w+/g, "USER") // Replace @user mentions with USER
    .replace(/https?:\/\/[^\s]+/g, "HTTPURL") // Replace URLs with HTTPURL
    .trim();
}

function extractAndProcessTweetText(tweetDiv: HTMLDivElement): string {
  let tweetText = "";

  for (const element of tweetDiv.children) {
    switch (element.tagName) {
      case "SPAN":
        tweetText += (element as HTMLSpanElement).textContent || "";
        break;
      case "IMG":
        const emoji = (element as HTMLImageElement).alt || "";
        tweetText += processEmoji(emoji);
        break;
      default:
        tweetText += element.textContent || "";
        break;
    }
  }

  return processTweetText(tweetText);
}

function scrapeTweets(): string[] {
  const currentTweets: string[] = [];

  const tweetDivs = document.querySelectorAll(
    "div[data-testid='tweetText']"
  ) as NodeListOf<HTMLDivElement>;

  for (const tweetDiv of tweetDivs) {
    const processedText = extractAndProcessTweetText(tweetDiv);
    currentTweets.push(processedText);
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
  toxicTweets = [];
}

function handleNewTweets(newTweets: string[]) {
  newTweets.forEach((tweet) => {
    let isNewTweet = true;
    for (const existingTweet of loadedTweets.values()) {
      if (existingTweet === tweet) {
        isNewTweet = false;
        break;
      }
    }

    if (isNewTweet) {
      currentTweetIds++;
      loadedTweets.set(currentTweetIds, tweet);
      newTweetsBuffer.push({ id: currentTweetIds, tweetText: tweet });
      console.log("New Tweet Added:", { currentTweetIds, tweetText: tweet });
      console.log("Current Id", currentTweetIds);
      console.log(loadedTweets);
    }
  });
}

function sendTweetsBufferToApi() {
  if (apiCallIntervalId !== null) return;

  apiCallIntervalId = window.setInterval(() => {
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

function stopSendTweetsBufferToApi() {
  if (highlightIntervalId !== null) {
    clearInterval(highlightIntervalId);
    highlightIntervalId = null;
  }
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

  stopSendTweetsBufferToApi();
  sendTweetsBufferToApi();
}

function stopObservingTweets() {
  if (observer) {
    observer.disconnect();
    observer = null;
    isObserving = false;
    stopSendTweetsBufferToApi();
    console.log("Tweet observer stopped.");
  }
}

function highlightToxicTweets() {
  if (highlightIntervalId !== null) return;

  highlightIntervalId = window.setInterval(() => {
    const tweetDivs = document.querySelectorAll(
      "div[data-testid='tweetText']"
    ) as NodeListOf<HTMLDivElement>;

    for (const tweetDiv of tweetDivs) {
      const processedText = extractAndProcessTweetText(tweetDiv);

      if (toxicTweets.includes(processedText)) {
        const tweetArticle = tweetDiv.closest('article[data-testid="tweet"]') as HTMLDivElement;
        tweetArticle.style.backgroundColor = "rgba(255, 70, 0, 0.5)";

        console.log("Highlighted toxic tweet:", toxicTweets);
      }
    }
  }, 2000);
}

function stopHighlightingToxicTweets() {
  if (highlightIntervalId !== null) {
    window.clearInterval(highlightIntervalId);
    highlightIntervalId = null;
  }
}

function processToxicTweet(toxicTweetsResponse: ApiRespone[]) {
  if (!toxicTweetsResponse || toxicTweetsResponse.length === 0) return;

  for (const toxicTweet of toxicTweetsResponse) {
    const tweetText = loadedTweets.get(toxicTweet.id);

    if (tweetText && toxicTweet.isToxic) {
      toxicTweets.push(tweetText);
      console.log("Toxic tweet found:", toxicTweet.id);
    }
  }
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case "startObserving":
      startObservingTweets();
      break;
    case "stopObserving":
      stopObservingTweets();
      stopHighlightingToxicTweets();
      break;
    case "highlightTweets":
      const toxicTweetsResponse = message.toxicTweetsResponse as ApiRespone[];
      processToxicTweet(toxicTweetsResponse);
      stopHighlightingToxicTweets();
      highlightToxicTweets();
      break;
  }
});

function getCurrentTweetData(): {
  processed: number;
  toxic: number;
  percentage: string;
} {
  const processed = loadedTweets.size;
  const toxic = toxicTweets.length;
  const percentage =
    processed > 0 ? ((toxic / processed) * 100).toFixed(2) : "0.00";
  return { processed, toxic, percentage };
}

window.setInterval(() => {
  const data = getCurrentTweetData();
  chrome.runtime.sendMessage({ action: "updatePopupData", data: data });
}, 1000);

chrome.runtime.sendMessage({ action: "getInitiateStatus" }, (response) => {
  if (response && response.status) {
    startObservingTweets();
  }
});
