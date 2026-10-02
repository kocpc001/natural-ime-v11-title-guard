# Natural IME V11–V13 Title Guard

[繁體中文](README.md) · [Downloads](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest)

A small Manifest V3 extension that shortens long page titles on X, Twitter, and Threads to work around a long-window-title compatibility problem in Natural Chinese IME. Keep typing in the original editor with V11–V13.

**Known affected versions: V11, V12, and V13.** The user has confirmed the same problem in these versions and reports that this workaround resolved input problems on X and Threads. The published binary and crash-dump analysis covers V11; V12 and V13 are supported by the user's testing reports, without separate binary analysis of those versions.

## Observed failure

In ten local crash dumps, `GOImeServer11.exe` terminated in `OVIMGoing.dll` with `0xc0000409`, fast-fail parameter `2`. The calling function passed a limit of 600 UTF-16 characters to `GetWindowTextW`, while the space between its destination buffer and stack cookie was only 600 bytes. The observed window title was 313 UTF-16 units long.

The guard caps long document titles at 180 UTF-16 units, leaving room for browser window-title suffixes. It preserves short titles, handles title changes, and avoids splitting surrogate pairs. This is a workaround for that specific crash path, not a general IME repair.

See the [detailed diagnosis in Traditional Chinese](docs/diagnosis.zh-TW.md). The repository/archive names and visible `V11` title suffix retain the original naming; they do not restrict the workaround to V11.

## Known unresolved issue: Gemini in Gmail's side panel

**Zhuyin input in Gmail's Gemini prompt intermittently stops working. The cause is unknown and no fix is available in this project.** Ordinary Gmail editors continue working. Gemini may ignore all Zhuyin input or drop part of a syllable, then temporarily recover. English input still works during the failure. For example, typing ㄕㄨ for 「輸」 may leave only ㄨ and produce 「屋」.

Passive monitoring with V11 captured keystrokes reaching the editor while composition content was removed and composition restarted on the next keystroke. This is a diagnostic lead, not an established root cause. The observations differ from the long-title crash on X and Threads.

The extension handles long titles on X, Twitter, and Threads only; it does not run on Gmail or fix Gemini. Temporary recovery after a reload or switching to English does not establish a fix. See [known issues in Traditional Chinese](docs/known-issues.zh-TW.md).

### Also unresolved: Telegram Web

The user also reports missing committed Chinese text in Telegram Web. Passive monitoring with V11 captured removal of the space used during composition and composition restarting on subsequent keystrokes. English input worked, and Chinese input later succeeded with existing English text. The page title was only 12 UTF-16 units, with no observed restart of the IME process. The event pattern resembles the Gemini case, but a shared root cause has not been established. **No Telegram fix is included.** See [known issues](docs/known-issues.zh-TW.md).

## Install

1. Download and extract the extension ZIP from [Releases](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest).
2. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the extracted `natural-ime-v11-title-guard` folder containing `manifest.json`. If using a GitHub source archive, select its `extension` subfolder instead.
4. Save any drafts, reload the affected website, and test your installed Natural IME in the original editor without posting.

Edge supports the same loading workflow through `edge://extensions`. Only Chrome page-level testing has been performed. This project is distributed through GitHub, not the Chrome Web Store.

## Privacy

The extension reads and changes only the page title. It does not read editor contents, record keystrokes, access the clipboard, store data, or make network requests. Its input-event listeners only trigger a title-length check and do not inspect event text or cancel events. Site access is limited to the domains in `manifest.json`; no additional extension API permissions are requested.

Disabling or removing the extension and reloading the page restores the website's original title behavior.

## Development

No build step or runtime dependency is needed for the extension. For reproducible DOM tests, use a supported Node.js version (Node.js 24 recommended):

```sh
npm ci
npm test
npm run package
```

Tests cannot exercise the Windows IME itself. The generated ZIP and its SHA-256 checksum are placed in `dist/`.

[MIT License](LICENSE). Independent project; not affiliated with the IME vendor, X, Meta, or browser vendors.
