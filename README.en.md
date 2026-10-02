# Natural IME V11 Title Guard

[繁體中文](README.md) · [Downloads](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest)

A small Manifest V3 extension that shortens long page titles on X, Twitter, and Threads to avoid a window-title buffer error found in an installed Natural Chinese IME V11 Zhuyin edition. Keep typing in the original editor with V11.

## Observed failure

In ten local crash dumps, `GOImeServer11.exe` terminated in `OVIMGoing.dll` with `0xc0000409`, fast-fail parameter `2`. The calling function passed a limit of 600 UTF-16 characters to `GetWindowTextW`, while the space between its destination buffer and stack cookie was only 600 bytes. The observed window title was 313 UTF-16 units long.

The guard caps long document titles at 180 UTF-16 units, leaving room for browser window-title suffixes. It preserves short titles, handles title changes, and avoids splitting surrogate pairs. This is a workaround for that specific crash path, not a general IME repair.

The user reported apparent improvement after a temporary title guard, while on X home. Retesting the original long-title post and persistent operation across navigation remains necessary. Threads is included as a preventive scope but its native V11 behavior is not yet verified. See the [detailed diagnosis in Traditional Chinese](docs/diagnosis.zh-TW.md).

## Install

1. Download and extract the extension ZIP from [Releases](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest).
2. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
3. Select the extracted `natural-ime-v11-title-guard` folder containing `manifest.json`. If using a GitHub source archive, select its `extension` subfolder instead.
4. Save any drafts, reload the affected website, and test native V11 typing in the original editor without posting.

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
