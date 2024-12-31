const STORAGE_KEY_INITIATE_STATUS = "initiateStatus";

async function getInitiateStatus(): Promise<boolean> {
  const result = await chrome.storage.local.get([STORAGE_KEY_INITIATE_STATUS]);
  return result[STORAGE_KEY_INITIATE_STATUS] ?? false; // Default to "false" (Stop initially)
}

async function setInitiateStatus(status: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_INITIATE_STATUS]: status });
}

module.exports = {
  getInitiateStatus,
  setInitiateStatus,
};
