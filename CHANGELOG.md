# Changelog

## 0.2.0 — 2026-10-03

- Add a Telegram Web K composition guard: preserve the IME's whitespace placeholder when the page tries to clear an apparently empty editor during composition.
- Native V11 testing confirmed four successful empty-editor Chinese commits without an English or numeric prefix. V12/V13 have not been separately tested for this fix.
- Add an experimental Gmail Gemini input filter for the Traditional Chinese prompt: suppress only the composing-space input notification while allowing the native edit and real text to proceed.
- Native V11 testing confirmed seven Chinese-text input events after filtering, including repeated empty-editor tests; the user reports normal input. Long-term intermittent behavior and other UI languages remain unverified.
- Expand content-script scope to Telegram Web K and Gmail; no additional extension API permissions, input logging, clipboard access, storage or network requests.
- Update privacy documentation and add regression tests for composition, normal clearing, other fields and dynamically replaced editors.

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
