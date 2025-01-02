# Chrome Extension

A Chrome extension for scraping and highlighting toxic tweets.

## Features
- Scrapes tweets from Twitter.
- Highlights tweets identified as toxic.
- Analyze toxicity of your tweet.

## Prerequisites
- Ensure [Node.js](https://nodejs.org/) is installed.

## How to Build and Install

1. Install dependencies:
    ```bash
    npm install
    ```

2. Build the project:
    ```bash
    npm run build
    ```

3. Locate the `dist/` folder, which contains the built extension.

4. Add the extension to Chrome:
    - Open Chrome and navigate to [chrome://extensions/](chrome://extensions/).
    - Enable `Developer Mode` in the top-right corner.
    - Click `Load unpacked` and select the `dist/` folder.
    - Activate the extension.

5. Make sure the Python Backend is activated first before using the extension.

## Credits
Special thanks to [getvictor](https://github.com/getvictor/create-chrome-extension) for the template!
