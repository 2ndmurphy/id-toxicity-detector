/* USED IN `popup.ts` & `background.ts` */
export interface StorageFunction {
  getInitiateStatus(): Promise<Boolean>;
  setInitiateStatus(status: boolean): Promise<void>;
}

/* USED IN `background.ts` & `content.ts` */
export interface TweetBuffer {
  id: number;
  tweetText: string;
}

export interface ApiRespone {
  id: number;
  isToxic: boolean;
}
