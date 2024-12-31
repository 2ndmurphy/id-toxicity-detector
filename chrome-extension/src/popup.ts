import { StorageFunction } from "./sharedTypes";

const { getInitiateStatus, setInitiateStatus } =
  require("./storageUtils") as StorageFunction;

const initiateButton = document.getElementById(
  "initiate-button"
) as HTMLButtonElement;

async function updateButtonState(): Promise<void> {
  const status = await getInitiateStatus();
  initiateButton.textContent = status ? "Stop" : "Start";
}

initiateButton.addEventListener("click", async () => {
  const currentStatus = await getInitiateStatus();
  const newStatus = !currentStatus;
  await setInitiateStatus(newStatus);
  initiateButton.textContent = newStatus ? "Stop" : "Start";

  chrome.runtime.sendMessage({
    action: newStatus ? "startAnalysis" : "stopAnalysis",
  });
});

// Initialize Button state on popup load (opening popup)
updateButtonState();
