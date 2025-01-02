import { TweetBuffer, ApiResponse } from "./sharedTypes";
import { getInitiateStatus, setInitiateStatus } from "./storageUtils";

let latestTweetData: {
  processed: number;
  toxic: number;
  percentage: string;
} | null = null;

let activeTwitterTabId: number | null = null;

async function sendHighlightingInstructions(
  tabId: number,
  toxicTweetsResponse: ApiResponse[]
) {
  chrome.tabs.sendMessage(tabId, {
    action: "highlightTweets",
    toxicTweetsResponse: toxicTweetsResponse,
  });
}

// Mock API function
async function callToxicAnalysisApi(
  tweets: TweetBuffer[]
): Promise<ApiResponse[]> {
  console.log("Sending to API:", tweets);
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = tweets.map((tweet) => ({
        id: tweet.id,
        isToxic: Math.random() < 0.5, // Example logic
      }));
      resolve(response);
    }, 3000);
  });
}

async function callUserTweetToxicAnalysisApi(tweet: string): Promise<string> {
  console.log("Sending user tweet to API:", tweet);
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = Math.random().toString();
      resolve(response);
    }, 3000);
  });
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  switch (message.action) {
    case "startAnalysis":
      await setInitiateStatus(true);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id !== undefined) {
            activeTwitterTabId = tab.id;
            chrome.tabs.sendMessage(tab.id, { action: "startObserving" });
          }
        });
      });
      break;

    case "stopAnalysis":
      await setInitiateStatus(false);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id !== undefined) {
            chrome.tabs.sendMessage(tab.id, { action: "stopObserving" });
          }
        });
      });
      activeTwitterTabId = null;
      break;

    case "processTweets":
      const tweetsToAnalyze = message.tweets as TweetBuffer[];
      if (tweetsToAnalyze && tweetsToAnalyze.length > 0) {
        const apiResponse = await callToxicAnalysisApi(tweetsToAnalyze);
        if (sender.tab && sender.tab.id !== undefined) {
          sendHighlightingInstructions(sender.tab.id, apiResponse);
        }
      }
      break;

    case "processUserTweets":
      const tweetToAnalyze = message.tweet as string;
      const tweetId = message.tweetId as number;
      if (tweetToAnalyze) {
        const apiResponse = await callUserTweetToxicAnalysisApi(tweetToAnalyze);
        chrome.tabs.sendMessage(sender.tab?.id as number, {
          action: "tweetAnalysisResult",
          toxicity: apiResponse,
          tweetId: tweetId,
        });
      }
      break;

    case "getInitiateStatus":
      const status = await getInitiateStatus();
      return Promise.resolve({ status: status });

    case "updatePopupData":
      latestTweetData = message.data;
      chrome.runtime.sendMessage({
        action: "getTweetData",
        data: message.data,
      });
      break;

    case "requestPopupData":
      if (latestTweetData) {
        chrome.runtime.sendMessage({
          action: "getTweetData",
          data: latestTweetData,
        });
      }
      break;
  }
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  if (tabId === activeTwitterTabId) {
    activeTwitterTabId = null;
    latestTweetData = null;
    await setInitiateStatus(false);

    chrome.runtime.sendMessage({
      action: "resetState",
    });
  }
});

// Set initial status on installation/update
chrome.runtime.onInstalled.addListener(() => {
  setInitiateStatus(false); // Initialize to 'Stop'
});
