// Mock API function to send new tweets
function mockApiCall(newTweets: string[]) {
  console.log("Sending to API:", newTweets);
}

// Utility to process tweet text: handle mentions and URLs
function processTweetText(text: string): string {
  return text
    .replace(/@\w+/g, "@USER") // Replace mentions with @USER
    .replace(/https?:\/\/[^\s]+/g, "HTTPURL") // Replace URLs with HTTPURL
    .trim();
}

// Function to scrape visible tweets
function scrapeTweets(): string[] {
  const tweetTextArray: string[] = [];
  const tweetDivs = document.querySelectorAll(
    "div[data-testid='tweetText']"
  ) as NodeListOf<HTMLDivElement>;

  for (const tweetDiv of tweetDivs) {
    let tweetText = "";

    for (const element of tweetDiv.children) {
      if (element.tagName === "SPAN") {
        tweetText += (element as HTMLSpanElement).textContent || "";
      } else if (element.tagName === "IMG") {
        tweetText += (element as HTMLImageElement).alt || "";
      } else {
        tweetText += element.textContent || "";
      }
    }

    tweetTextArray.push(processTweetText(tweetText));
  }

  return tweetTextArray;
}

// Wait for the tweet container to load
function waitForTweetContainer(): Promise<HTMLElement> {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const container = document.querySelector("main[role='main']") as HTMLElement;
      if (container) {
        clearInterval(interval);
        resolve(container);
      }
    }, 100);
  });
}

// Main function to observe tweets and handle new tweets dynamically
async function observeTweets() {
  const tweetContainer = await waitForTweetContainer();
  console.log("Tweet container found. Setting up MutationObserver...");

  if (!tweetContainer) {
    console.error("Tweet container not found!");
    return;
  }

  const visibleTweets = new Set<string>();
  const newTweetsBuffer: string[] = []; // Buffer to collect new tweets for the mock API
  let lastApiCallTime = Date.now();

  // Function to reset the Set when entering/exiting a tweet detail view
  function resetVisibleTweets() {
    console.log("Resetting visible tweets...");
    visibleTweets.clear();
  }

  // Event listeners for clicks on tweets and exiting tweet detail views
  tweetContainer.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;
    if (target.closest("article")) {
      resetVisibleTweets();
    }
  });
  window.addEventListener("popstate", resetVisibleTweets); // Detect exiting tweet details

  // MutationObserver to detect new tweets
  const observer = new MutationObserver(() => {
    const newTweets = scrapeTweets();

    newTweets.forEach((tweet) => {
      if (!visibleTweets.has(tweet)) {
        visibleTweets.add(tweet);
        newTweetsBuffer.push(tweet); // Collect new tweets for API
        console.log("New Tweet:", tweet);
        console.log(visibleTweets);
      }
    });
  });

  observer.observe(tweetContainer, { childList: true, subtree: true });
  console.log("Tweet observer started!");

  // Send data to the API every 5 seconds, only for new items
  setInterval(() => {
    const now = Date.now();
    if (newTweetsBuffer.length > 0 && now - lastApiCallTime >= 5000) {
      mockApiCall(newTweetsBuffer);
      newTweetsBuffer.length = 0; // Clear buffer after sending
      lastApiCallTime = now;
    }
  }, 1000); // Check every second, but enforce a 5-second interval
}

// Initialize
observeTweets();
