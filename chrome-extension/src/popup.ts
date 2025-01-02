import { getInitiateStatus, setInitiateStatus } from "./storageUtils";

const negativityAmount = document.getElementById(
  "negativity-amount"
) as HTMLSpanElement;
const scrappedAmount = document.getElementById(
  "scrapped-amount"
) as HTMLSpanElement;
const percentageToxic = document.getElementById(
  "percentage-toxic"
) as HTMLSpanElement;

const initiateButton = document.getElementById(
  "initiate-button"
) as HTMLButtonElement;

function updateDisplay(data: {
  processed: number;
  toxic: number;
  percentage: string;
}) {
  scrappedAmount.textContent = String(data.processed);
  negativityAmount.textContent = String(data.toxic);
  percentageToxic.textContent = `${data.percentage}%`;
}

function resetDisplay() {
  scrappedAmount.textContent = "0";
  negativityAmount.textContent = "0";
  percentageToxic.textContent = "0%";
}

async function initButtonState(): Promise<void> {
  const status = await getInitiateStatus();
  initiateButton.textContent = status ? "Stop" : "Start";

  chrome.runtime.sendMessage({
    action: status ? "startAnalysis" : "stopAnalysis",
  });
}

async function redirectToTwitter(tabId: number) {
  chrome.tabs.update(tabId, { url: "https://twitter.com" });
}

async function handleInitiateButtonClick() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    let currentTab = tabs[0];
    const twitterDomains = ["twitter.com", "x.com"];
    const isOnTwitter = twitterDomains.some(
      (domain) => currentTab.url && currentTab.url.includes(domain)
    );

    if (!isOnTwitter) {
      redirectToTwitter(currentTab.id || 0);
      return;
    }

    const currentStatus = await getInitiateStatus();
    const newStatus = !currentStatus;
    await setInitiateStatus(newStatus);
    initiateButton.textContent = newStatus ? "Stop" : "Start";

    chrome.runtime.sendMessage({
      action: newStatus ? "startAnalysis" : "stopAnalysis",
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "requestPopupData" });
  initButtonState();
});

initiateButton.addEventListener("click", handleInitiateButtonClick);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "getTweetData":
      updateDisplay(message.data);
      break;
    case "resetState":
      resetDisplay();
      initiateButton.textContent = "Start";
      break;
  }
});
