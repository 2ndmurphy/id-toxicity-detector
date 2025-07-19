import {
  getInitiateStatus,
  setInitiateStatus,
  getHideToxicTweetStatus,
  setHideToxicTweetStatus,
  getUserAnonStatus,
  setUserAnonStatus,
} from "./storageUtils";

const negativityAmount = document.getElementById(
  "negativity-amount"
) as HTMLSpanElement;
const scrappedAmount = document.getElementById(
  "scrapped-amount"
) as HTMLSpanElement;
const percentageToxic = document.getElementById(
  "percentage-toxic"
) as HTMLSpanElement;

const hideToxicTweetSlider = document.getElementById(
  "hide-toxic-tweets"
) as HTMLInputElement;
const userAnonSlider = document.getElementById(
  "user-anon"
) as HTMLInputElement;

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

async function initSliderStates(): Promise<void> {
  const hideToxicTweetStatus = await getHideToxicTweetStatus();
  const userAnonStatus = await getUserAnonStatus();

  hideToxicTweetSlider.checked = hideToxicTweetStatus;
  userAnonSlider.checked = userAnonStatus;
}

hideToxicTweetSlider.addEventListener("change", async () => {
  await setHideToxicTweetStatus(hideToxicTweetSlider.checked);
  chrome.runtime.sendMessage({
    action: "hideToxicTweetStatusChange",
    status: hideToxicTweetSlider.checked,
  });
});

userAnonSlider.addEventListener("change", async () => {
  await setUserAnonStatus(userAnonSlider.checked);
  chrome.runtime.sendMessage({
    action: "userAnonStatusChange",
    status: userAnonSlider.checked,
  });
});

async function initButtonState(): Promise<void> {
  const status = await getInitiateStatus();
  initiateButton.innerHTML = status ?
    "<i class=\"fa-solid fa-stop\" style=\"margin-right: 8px;\"></i>Stop Session" :
    "<i class=\"fa-solid fa-play\" style=\"margin-right: 8px;\"></i>Start Session";

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
    initiateButton.innerHTML = newStatus ?
      "<i class=\"fa-solid fa-stop\" style=\"margin-right: 8px;\"></i>Stop Session" :
      "<i class=\"fa-solid fa-play\" style=\"margin-right: 8px;\"></i>Start Session";

    chrome.runtime.sendMessage({
      action: newStatus ? "startAnalysis" : "stopAnalysis",
    });
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  chrome.runtime.sendMessage({ action: "requestPopupData" });
  await initButtonState();
  await initSliderStates();
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
