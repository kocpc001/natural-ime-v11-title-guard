# Natural IME V11–V13 Web Compatibility Guard

[繁體中文](README.md) · [Downloads](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest)

A small Manifest V3 extension that shortens long page titles on X, Twitter, and Threads to work around a long-window-title compatibility problem in Natural Chinese IME. Keep typing in the original editor with V11–V13. Version 0.2.0 adds Telegram Web K composition protection and an experimental Gmail Gemini filter.

**Known affected versions: V11, V12, and V13.** The user has confirmed the same problem in these versions and reports that this workaround resolved input problems on X and Threads. The published binary and crash-dump analysis covers V11; V12 and V13 are supported by the user's testing reports, without separate binary analysis of those versions.

## Observed failure

In ten local crash dumps, `GOImeServer11.exe` terminated in `OVIMGoing.dll` with `0xc0000409`, fast-fail parameter `2`. The calling function passed a limit of 600 UTF-16 characters to `GetWindowTextW`, while the space between its destination buffer and stack cookie was only 600 bytes. The observed window title was 313 UTF-16 units long.

The guard caps long document titles at 180 UTF-16 units, leaving room for browser window-title suffixes. It preserves short titles, handles title changes, and avoids splitting surrogate pairs. This is a workaround for that specific crash path, not a general IME repair.

See the [detailed diagnosis in Traditional Chinese](docs/diagnosis.zh-TW.md). The repository/archive names and visible `V11` title suffix retain the original naming; they do not restrict the workaround to V11.

## Telegram Web K: composition cleanup

Tracing identified Telegram's input handler calling `replaceChildren()` when the editor contains only whitespace, deleting V11's composition placeholder. An English character or digit prevents this empty-editor cleanup. The new guard preserves the placeholder only while composing, then allows normal clearing. Native V11 testing confirmed four successful empty-editor Chinese commits. V12/V13 and Telegram Web A have not been separately tested.

## Gmail Gemini: experimental workaround

Gmail's Gemini prompt intermittently ignored Zhuyin or lost part of a syllable. Tracing identified Gmail/Gemini clearing the composition space. The filter suppresses only the composing-space input notification, leaving the native edit and real-text events intact. Native V11 testing captured seven Chinese input events after filtering, including repeated empty-editor tests; the user reports normal input.

This is initial validation, not proof that every intermittent failure is resolved. The filter targets the Traditional Chinese prompt labeled 「向 Gemini 提問」. Other UI languages, long-term stability and V12/V13 remain unverified. Some earlier successful commits also followed placeholder removal, so a universal root cause is not established. These observations differ from the X/Threads long-title crash. See [known issues and validation limits](docs/known-issues.zh-TW.md).

## Install

1. Download and extract the extension ZIP from [Releases](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest).
2. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the extracted `natural-ime-v11-title-guard` folder containing `manifest.json`. If using a GitHub source archive, select its `extension` subfolder instead.
4. Save any drafts, reload the affected website, and test your installed Natural IME in the original editor without posting.

Edge supports the same loading workflow through `edge://extensions`. Only Chrome page-level testing has been performed. This project is distributed through GitHub, not the Chrome Web Store.

## Privacy

The X/Threads script reads and changes page titles. The Telegram script reads the target message editor's current text to detect composition whitespace; the Gmail script checks the target Gemini input event for its placeholder space. None of this text or event data is recorded, stored or transmitted. No clipboard, account or cookie access, keystroke logging, storage or network requests are used.

Version 0.2.0 expands content-script access to Telegram Web K and Gmail. No additional extension API permissions are requested. Telegram/Gmail scripts run in the MAIN world to handle page composition behavior. The Gmail script does not inspect mail bodies or ordinary mail editors.

Disabling or removing the extension and reloading the page restores the website's original title and editor behavior.

## Development

No build step or runtime dependency is needed for the extension. For reproducible DOM tests, use a supported Node.js version (Node.js 24 recommended):

```sh
npm ci
npm test
npm run package
```

Tests cannot exercise the Windows IME itself. The generated ZIP and its SHA-256 checksum are placed in `dist/`.

[MIT License](LICENSE). Independent project; not affiliated with the IME vendor, X, Meta, or browser vendors.
