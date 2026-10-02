# Changelog

## 0.1.1 — 2026-10-03

- Rename the displayed project and extension title to cover Natural IME V11–V13.
- Record user-confirmed affected versions and resolution on X and Threads; retain V11 as the source of the published binary analysis.
- Document intermittent Gmail Gemini Zhuyin failures as unresolved, with an unknown root cause.
- Record a similar unresolved Chinese-input failure in Telegram Web without claiming a shared root cause.
- Include the known-issues document in release archives.
- Preserve title-guard behavior, the legacy V11 suffix, site scope and permissions.

## 0.1.0 — 2026-10-02

- Initial Manifest V3 extension for X, Twitter, and Threads.
- Limit long document titles to 180 UTF-16 units with a visible `… | V11` suffix.
- Protect dynamically replaced titles and check before focus/input events.
- Document the locally observed V11 window-title buffer error and validation limits.
- Add automated DOM regression tests, CI, and reproducible ZIP packaging.
