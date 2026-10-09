# OTP Helper Chrome Extension

Quickly finds one‑time‑passwords (OTPs) in Gmail and lets you copy or autofill them on the current webpage.

## Features

- Secure Google OAuth (no passwords stored)
- Detects OTP codes in recent Gmail messages
- Action buttons:
  - **Copy OTP** – copy to clipboard
  - **Fill OTP** – automatically fill split input fields
  - **Open Verification Link** – preview link before opening
  - **View Full Email** – display email body with links
  - **Open Gmail** – jump to the message in Gmail

## Setup

1. **Create a Google Cloud project**
   - Go to https://console.cloud.google.com/
   - Enable **Gmail API** for the project.

2. **Create a Chrome App OAuth client**
   - Under **APIs & Services ➜ Credentials** create an **OAuth 2.0 Client ID** ➜ **Chrome App**.
   - Redirect URI: `https://<EXT_ID>.chromiumapp.org/`
     (you can find `<EXT_ID>` after loading the extension in Chrome – it will appear in the review console).

3. **Insert Client ID**
   - Replace the string `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com` in `manifest.json`.

4. **Load unpacked extension**
   - Open Chrome → **Extensions** → **Load unpacked** → point to `otp-helper` directory.

5. **Grant permissions**
   - First time click icon, sign into Google, grant **Gmail read‑only** scope.

## Usage

- Click the extension icon.
- The list updates on refresh or auto‑refresh.
- Use buttons to copy, fill, view or open the email.

## Security Notes

- OAuth tokens are stored in Chrome’s secure keychain, never in `chrome.storage`.
- Email contents processed locally; no external server.
- Links opened only after user interaction and are shown with domain first.

## Known Limitations

- If the current page has multiple text inputs that are not OTP fields, autofill distributes digits across all of them.
- Split‑field detection assumes contiguous inputs; custom widgets may not work.
- Only reads *unread* messages containing defined keywords.

## License
MIT © Gitansh Phutela
