const STORAGE_KEY_INITIATE_STATUS = "initiateStatus";
const STORAGE_KEY_HIDE_TOXIC_TWEET = "hideToxicTweet";
const STORAGE_KEY_USER_ANON = "userAnon";

export async function getInitiateStatus(): Promise<boolean> {
  const result = await chrome.storage.local.get([STORAGE_KEY_INITIATE_STATUS]);
  return result[STORAGE_KEY_INITIATE_STATUS] ?? false; // Default to "false" (Stop initially)
}

export async function setInitiateStatus(status: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_INITIATE_STATUS]: status });
}

export async function getHideToxicTweetStatus(): Promise<boolean> {
  const result = await chrome.storage.local.get([STORAGE_KEY_HIDE_TOXIC_TWEET]);
  return result[STORAGE_KEY_HIDE_TOXIC_TWEET] ?? false; // Default to false (not hidden)
}

export async function setHideToxicTweetStatus(status: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_HIDE_TOXIC_TWEET]: status });
}

export async function getUserAnonStatus(): Promise<boolean> {
  const result = await chrome.storage.local.get([STORAGE_KEY_USER_ANON]);
  return result[STORAGE_KEY_USER_ANON] ?? false; // Default to false (not anonymous)
}

export async function setUserAnonStatus(status: boolean): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY_USER_ANON]: status });
}
