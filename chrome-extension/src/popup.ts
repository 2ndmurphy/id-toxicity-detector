const STORAGE_KEY_INITIATE_STATUS = "initiateStatus";

async function getInitiateStatus(): Promise<boolean> {
  const result = await chrome.storage.local.get([STORAGE_KEY_INITIATE_STATUS]);
  return result[STORAGE_KEY_INITIATE_STATUS] ?? true; // Default to "true" (Start)
}

async function setInitiateStatus(status: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_INITIATE_STATUS]: status });
}

const initiateButton = document.getElementById(
  "initiate-button"
) as HTMLButtonElement;

async function updateButtonState(): Promise<void> {
  const status = await getInitiateStatus();
  initiateButton.textContent = status ? "Start" : "Stop";
}

initiateButton.addEventListener("click", async () => {
  const currentStatus = await getInitiateStatus();
  const newStatus = !currentStatus;
  await setInitiateStatus(newStatus);
  initiateButton.textContent = newStatus ? "Start" : "Stop";
});

// Initialize Button state on popup load (opening popup)
updateButtonState();
