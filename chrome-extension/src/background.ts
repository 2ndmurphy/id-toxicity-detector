import { StorageFunction, TweetBuffer, ApiRespone } from "./sharedTypes";

const { getInitiateStatus, setInitiateStatus } =
  require("./storageUtils") as StorageFunction;

async function sendHighlightingInstructions(
  tabId: number,
  toxicTweets: ApiRespone[]
) {
  chrome.tabs.sendMessage(tabId, {
    action: "highlightTweets",
    toxicTweets: toxicTweets,
  });
}

// Mock API function
async function callToxicAnalysisApi(
  tweets: TweetBuffer[]
): Promise<ApiRespone[]> {
  console.log("Sending to API:", tweets);
  return new Promise((resolve) => {
    setTimeout(() => {
      const response = tweets.map((tweet) => ({
        id: tweet.id,
        isToxic: Math.random() < 0.5, // Example logic
      }));
      resolve(response);
    }, 1000);
  });
}

chrome.runtime.onMessage.addListener(async (request, sender) => {
  switch (request.action) {
    case "startAnalysis":
      await setInitiateStatus(true);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        tabs.forEach((tab) => {
          if (tab.id !== undefined) {
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
      break;

    case "processTweets":
      const tweetsToAnalyze = request.tweets as TweetBuffer[];
      if (tweetsToAnalyze && tweetsToAnalyze.length > 0) {
        const apiResponse = await callToxicAnalysisApi(tweetsToAnalyze);
        if (sender.tab && sender.tab.id !== undefined) {
          sendHighlightingInstructions(sender.tab.id, apiResponse);
        }
      }
      break;

    case "getInitiateStatus":
      const status = await getInitiateStatus();
      return Promise.resolve({ status: status });
  }
});

// Set initial status on installation/update
chrome.runtime.onInstalled.addListener(() => {
  setInitiateStatus(false); // Initialize to 'Stop'
});
