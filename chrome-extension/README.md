# Chrome Extension

Chrome extension for scraping & highlight toxic Tweets.

## How to Build & Install
> [!NOTE]
> Make sure you have [NodeJS](https://nodejs.org/) installed on your device.

1. Clone this repository
    ```
    git clone https://github.com/Luckwut/id-toxicity-detector.git
    ```

2. Go to `chrome-extension/` directory
    ```
    cd chrome-extension/
    ```

3. Install dependencies
    ```
    npm install
    ```

4. Build the project
    ```
    npm run build
    ```

5. Look for `dist/` folder. That is the chrome extension.
6. Open Chrome and go to [chrome://extensions/](chrome://extensions/)
7. Activate `Developer Mode`.
8. Click `Load unpacked` button.
9. Go to this project folder and select the `dist/` folder.
10. Activate the extension.


## Special Thanks
- [https://github.com/getvictor/create-chrome-extension](https://github.com/getvictor/create-chrome-extension) untuk template TS + Webpack.
