import { unemojify } from "node-emoji";
import { computePosition, flip, offset } from "@floating-ui/dom";
import { TweetBuffer, ApiResponse } from "./sharedTypes";

/* *** ANALYZE TWEET *** */
/* ************************** */

interface ToxicTweet {
  tweetText: string,
  toxicity: number,
}

const BATCH_PROCESSING_AMOUNT = 5;
const TOXICITY_THRESHOLD = 0.5;

let isObserving = false;
let observer: MutationObserver | null = null;

let loadedTweets = new Map<number, string>();
let toxicTweets: ToxicTweet[] = [];
let newTweetsBuffer: TweetBuffer[] = [];

let currentTweetIds = 0;

let lastApiCallTime = Date.now();

let apiCallIntervalId: number | null = null;
let highlightIntervalId: number | null = null;

function preProcessTweetText(text: string): string {
  return unemojify(
    text
      .toLowerCase()
      .replace(/@\w+/g, "USER") // Replace @user mentions with USER
      .replace(/https?:\/\/[^\s]+/g, "HTTPURL") // Replace URLs with HTTPURL
      .trim()
  );
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
        tweetText += emoji;
        break;
      default:
        tweetText += element.textContent || "";
        break;
    }
  }

  return preProcessTweetText(tweetText);
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
    if (newTweetsBuffer.length >= BATCH_PROCESSING_AMOUNT && now - lastApiCallTime >= 5000) {
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

function interpolateColor(minColor: string, maxColor: string, factor: number): string {
  const minRgb = minColor.match(/\d+/g)?.map(Number) || [255, 255, 255];
  const maxRgb = maxColor.match(/\d+/g)?.map(Number) || [0, 0, 0];

  const r = Math.round(minRgb[0] + (maxRgb[0] - minRgb[0]) * factor);
  const g = Math.round(minRgb[1] + (maxRgb[1] - minRgb[1]) * factor);
  const b = Math.round(minRgb[2] + (maxRgb[2] - minRgb[2]) * factor);
  const a = 0.5;

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function highlightToxicTweets() {
  if (highlightIntervalId !== null) return;

  const maxHighlightColor = "rgba(255, 30, 0, 0.5)";  // Highest toxicity color
  const minHighlightColor = "rgba(255, 180, 0, 0.5)";  // Lowest toxicity color

  highlightIntervalId = window.setInterval(() => {
    const tweetDivs = document.querySelectorAll(
      "div[data-testid='tweetText']"
    ) as NodeListOf<HTMLDivElement>;

    for (const tweetDiv of tweetDivs) {
      const processedText = extractAndProcessTweetText(tweetDiv);

      const tweet = toxicTweets.find(t => t.tweetText === processedText);

      if (tweet) {
        const tweetArticle = tweetDiv.closest(
          'article[data-testid="tweet"]'
        ) as HTMLDivElement;

        const toxicityFactor = Math.min(Math.max(tweet.toxicity, 0), 1);
        const backgroundColor = interpolateColor(minHighlightColor, maxHighlightColor, toxicityFactor);

        tweetArticle.style.backgroundColor = backgroundColor;

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

function processToxicTweet(toxicTweetsResponse: ApiResponse[]) {
  if (!toxicTweetsResponse || toxicTweetsResponse.length === 0) return;

  for (const toxicTweet of toxicTweetsResponse) {
    const tweetText = loadedTweets.get(toxicTweet.id);

    console.log(`Tweet Id ${toxicTweet.id} | Toxicity ${toxicTweet.toxicity} > Threshold ${TOXICITY_THRESHOLD}`);

    if (tweetText && toxicTweet.toxicity > TOXICITY_THRESHOLD) {
      toxicTweets.push({
        tweetText: tweetText,
        toxicity: toxicTweet.toxicity
      });
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
      const toxicTweetsResponse = message.toxicTweetsResponse as ApiResponse[];
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

/* *** ANALYZE USER TWEET *** */
/* ************************** */

function debounce(func: Function, delay: number) {
  let timeoutId: number | undefined;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

let isAnalysisInProgress = false;
let currentAnalysisTweetId: number | null = null;
let nextAnalysisTweetId = 0;

function sendUserTweetToApi(tweet: string, tweetId: number) {
  const analyzeButton = document.querySelector(
    "#extension-tweet-tooltip button"
  ) as HTMLButtonElement;

  analyzeButton.disabled = true;
  analyzeButton.textContent = "Loading...";
  isAnalysisInProgress = true;
  currentAnalysisTweetId = tweetId;

  chrome.runtime.sendMessage({ action: "processUserTweets", tweet, tweetId });
}

function createAnalyzeTooltip(textArea: HTMLDivElement): HTMLDivElement {
  const div = document.createElement("div");
  div.id = "extension-tweet-tooltip";
  div.style.cssText = `
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    align-items: center;
    width: max-content;
    position: absolute;
    top: 0;
    left: 0;
    border: 2px solid #1d9bf0;
    background-color: white;
    border-radius: 15px;
    overflow: hidden;
    z-index: 9999;
  `;

  const button = document.createElement("button");
  button.textContent = "Analisis Tweetmu";
  button.onclick = () => {
    if (textArea.textContent && !isAnalysisInProgress) {
      const tweetId = nextAnalysisTweetId++;
      sendUserTweetToApi(textArea.textContent, tweetId);
    }
  };
  button.style.cssText = `
    background-color: #1d9bf0;
    cursor: pointer;
    border: none;
    color: white;
    padding: 0px, 12px;
    font-size: 1em;
  `;

  const paragraph = document.createElement("p");
  paragraph.textContent = "Persentase Toksisitas:";
  paragraph.style.cssText = `
    color: #000000;
    margin: 0 10px;
  `;

  const span = document.createElement("span");
  span.id = "toxicity-percentage";
  span.textContent = "0%";
  span.style.cssText = `
    margin-left: 5px;
  `;

  div.appendChild(button);
  paragraph.appendChild(span);
  div.appendChild(paragraph);

  return div;
}

function positionTooltipAboveTextArea(
  textArea: HTMLDivElement,
  tooltip: HTMLDivElement
) {
  computePosition(textArea, tooltip, {
    placement: "top",
    middleware: [offset({ mainAxis: 6, crossAxis: -40 }), flip()],
  })
    .then(({ x, y }) => {
      Object.assign(tooltip.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    })
    .catch(console.error);
}

function observeTweetTextArea() {
  let tweetTextArea: HTMLDivElement | null = null;
  let analyzeTooltip: HTMLDivElement | null = null;

  const updateTooltip = debounce(() => {
    if (!tweetTextArea) return;

    const textContent = tweetTextArea.textContent?.trim();

    if (!textContent) {
      if (isAnalysisInProgress) {
        isAnalysisInProgress = false;
        currentAnalysisTweetId = null;
        console.log("Analysis Failed: Tooltip Removed before Request resolved");
      }
      analyzeTooltip?.remove();
      analyzeTooltip = null;
      return;
    }

    if (!analyzeTooltip) {
      analyzeTooltip = createAnalyzeTooltip(tweetTextArea);
      document.body.appendChild(analyzeTooltip);
    }

    positionTooltipAboveTextArea(tweetTextArea, analyzeTooltip);
  }, 300);

  const handleTextAreaChange = (textArea: HTMLDivElement) => {
    const inputObserver = new MutationObserver(updateTooltip);
    inputObserver.observe(textArea, {
      characterData: true,
      childList: true,
      subtree: true,
    });
  };

  const findTweetTextArea = debounce(() => {
    const textArea = document.querySelector(
      "div[data-testid='tweetTextarea_0']"
    ) as HTMLDivElement | null;

    if (textArea && textArea !== tweetTextArea) {
      tweetTextArea = textArea;
      handleTextAreaChange(textArea);
      updateTooltip();
    }
  }, 200);

  const bodyObserver = new MutationObserver(findTweetTextArea);
  bodyObserver.observe(document.body, { childList: true, subtree: true });

  findTweetTextArea();
}

observeTweetTextArea();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "tweetAnalysisResult") {
    const percentageSpan = document.querySelector(
      "span#toxicity-percentage"
    ) as HTMLSpanElement;
    const analyzeButton = document.querySelector(
      "#extension-tweet-tooltip button"
    ) as HTMLButtonElement;

    if (message.tweetId === currentAnalysisTweetId) {
      percentageSpan.textContent = `${(
        parseFloat(message.toxicity) * 100
      ).toFixed(2)}%`;
    }
    analyzeButton.disabled = false;
    analyzeButton.textContent = "Analisis Tweetmu";
    isAnalysisInProgress = false;
    currentAnalysisTweetId = null;
  }
});
