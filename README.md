Okay, here's a README.md file you can use for your GitHub repository for the Gmail Trust Indicator. I've tried to make it clear, concise, and informative. I've also included badges and links to make it professional.

# Gmail Trust Indicator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Enhance your Gmail experience by displaying sender domains and icons for quick identification and managing trusted senders. This userscript helps you quickly assess the legitimacy of emails directly within your Gmail inbox.

<img src="https://raw.githubusercontent.com/cwlum/gmail-trust-tindicator/main/screenshot_01.jpeg" alt="Gmail Trust Indicator Screenshot" width="600">

<img src="https://raw.githubusercontent.com/cwlum/gmail-trust-tindicator/main/screenshot_02.jpeg" alt="Gmail Trust Indicator Screenshot" width="600">

## Features

*   **Domain Display:** Shows the sender's domain next to their name in the inbox view.
*   **Favicon Display:**  Displays the website favicon of the sender's domain for visual identification.
*   **Trust Indicator:**  Visually highlights trusted (whitelisted) and untrusted senders.
*   **Whitelist Management:**  Easily add and remove domains or specific email addresses from a whitelist.
*   **Highlight Untrusted Emails:**  Optionally highlights entire rows of emails from senders *not* on your whitelist.
*   **Cross-Tab Synchronization:** Whitelist updates are synced across all your open Gmail tabs.
*   **Customizable:** Toggle domain display, icon display, and highlighting of untrusted emails via the Tampermonkey menu.
*   **Tooltip Information:** Hover over the domain to see the full email address, domain, and whitelist status.

## Installation

1.  Install a userscript manager such as [Tampermonkey](https://www.tampermonkey.net/) (Chrome, Firefox, Safari, Edge).
2.  Click the following link to install the script: [https://github.com/cwlum/gmail-trust-tindicator/raw/main/gmail-trust-indicator.user.js](https://github.com/cwlum/gmail-trust-tindicator/raw/main/gmail-trust-indicator.user.js)
3.  Tampermonkey will prompt you to install the script. Click "Install".

## Usage

Once installed, the script will automatically enhance your Gmail inbox.

*   **Automatic Domain & Icon Display:**  The sender's domain and favicon will be displayed next to their name in your inbox.
*   **Whitelist Management:**
    *   Click on the displayed domain to toggle the sender's email or domain on/off the whitelist.  A tooltip will confirm the action.
    *   Manage your whitelist by clicking the "⚙️ Manage Whitelist" option in the Tampermonkey menu. This opens a panel to add, remove, and search for domains and email addresses.
*   **Configuration:** Access the Tampermonkey menu to toggle the display of icons, domains, and highlighting of untrusted emails.
*   **Clearing Whitelists:** To remove all domains and email addresses from the whitelist, select "🗑️ Clear All Whitelists" in the Tampermonkey menu.

## Configuration Options (via Tampermonkey Menu)

*   `✅ / ❌ Show/Hide Icons`: Toggles the display of favicons next to sender names.
*   `✅ / ❌ Show/Hide Domains`: Toggles the display of domains next to sender names.
*   `✅ / ❌ Highlight Untrusted Emails`: Toggles highlighting of emails from senders not on your whitelist.
*   `⚙️ Manage Whitelist`: Opens a panel to manage allowed domains and email addresses.
*   `🗑️ Clear All Whitelists`: Clears all whitelists for all accounts.

## Contributing

Contributions are welcome! If you find a bug or have a feature request, please create an issue on the [issue tracker](https://github.com/cwlum/gmail-trust-tindicator/issues).

If you would like to contribute code, please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this script helpful, consider leaving a star on the [GitHub repository](https://github.com/cwlum/gmail-trust-tindicator).  It helps others discover the project!

## Updates

* **v1.0 (Current)** 
content_copy download
Use code with caution.
Markdown
Key improvements and explanations:
