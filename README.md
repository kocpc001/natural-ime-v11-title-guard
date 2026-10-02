# 自然輸入法 V11 標題相容修正

[English](README.en.md) · [下載外掛](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest) · [問題分析](docs/diagnosis.zh-TW.md)

保留自然輸入法 V11，在 X／Threads 原本的欄位輸入中文。這個小型瀏覽器外掛會縮短過長的分頁標題，避開本機辨識到的 V11 視窗標題緩衝區錯誤。

## 為什麼特定頁面打不出中文？

本次案例中，記事本與其他 Chrome 頁面正常，但某篇 X 貼文的回覆欄位收不到中文，甚至同一視窗的聊天側邊欄也受到影響。十份本機當機檔都指向 `OVIMGoing.dll` 讀取前景視窗標題的同一條路徑。

該程式的緩衝區到安全檢查值之間只有 **600 位元組（300 個 UTF-16 單位）**，呼叫 `GetWindowTextW` 時卻允許寫入 **600 個 UTF-16 字元**。案例中的視窗標題長度為 **313**，導致堆疊檢查失敗、輸入法背景服務終止。

X 會將貼文內容放進分頁標題，因此某些貼文會觸發此問題。這個外掛把超過 **180 個 UTF-16 單位**的標題縮短，保留標題開頭並加上 `… | V11`，為瀏覽器的視窗後綴預留空間。

這是針對已辨識當機路徑的相容處理。使用者回報「應該是解決了」；回報當時位於 X 首頁，原長標題貼文、跨頁持續效果與 Threads 的實際 V11 輸入仍待完整驗證。不同 V11 revision 或不同輸入問題不一定適用，詳見[診斷紀錄與限制](docs/diagnosis.zh-TW.md)。

## 安裝

目前透過 GitHub 發布，採用載入未封裝外掛的方式。

1. 從 [Releases](https://github.com/kocpc001/natural-ime-v11-title-guard/releases/latest) 下載 `natural-ime-v11-title-guard-v0.1.0.zip`，並解壓縮。
2. Chrome 開啟 `chrome://extensions`，開啟右上角「開發人員模式」。
3. 選「載入未封裝項目」，選取解壓縮後的 `natural-ime-v11-title-guard` 資料夾；此資料夾內應有 `manifest.json`。
4. 先保存草稿，再重新載入 X／Threads 分頁，讓外掛開始執行。
5. 在原本失敗的貼文回覆欄位，以 V11 組字並確認；文字應能保留，不必發布。

若下載的是 GitHub 原始碼 ZIP，步驟 3 請改選其中的 `extension` 資料夾。

Edge 可用 `edge://extensions` 依同樣方式載入；其他支援 Manifest V3 的 Chromium 瀏覽器可能適用，但目前實際頁面測試僅涵蓋 Chrome。

## 外掛做了什麼？

- 只在 X、Twitter、Threads 的 HTTPS 網頁頂層執行。
- 短標題保留；長標題截短，並避免把 emoji 的 UTF-16 surrogate pair 切成半個。
- 監看 `<head>` 的標題變化，處理不重新載入的頁面切換。
- 在取得焦點、按鍵與開始組字時同步檢查標題長度。
- 全程在原欄位打字，無須額外输入框或快捷鍵。

## 隱私與權限

執行中的外掛只讀取／修改分頁標題。程式沒有讀取欄位內容、剪貼簿、帳號或 Cookie，沒有紀錄按鍵、儲存資料或發出網路請求。輸入相關事件只觸發標題檢查，沒有讀取事件文字，也不取消事件。

Manifest 只宣告指定網站的內容腳本，沒有 `tabs`、`clipboardRead`、`scripting` 等額外 API 權限。Chrome 仍會顯示這些網站的頁面存取權，因為內容腳本必須能修改標題。原始當機檔與私人測試資料不包含在專案中。

## 更新與移除

更新時，以新版檔案取代原資料夾中的檔案，在擴充功能頁按外掛的重新載入按鈕，再保存草稿並重新載入網站。

停用／移除外掛後，重新載入網站會還原網站本身的標題。先前已经執行的內容腳本可能持續到該頁面重新載入為止。

## 開發與測試

外掛沒有建置步驟或執行期依賴。自動化 DOM 測試需要 Node.js 24 或符合 `package.json` 的版本：

```sh
npm ci
npm test
npm run package
```

測試包括短／長標題、emoji 邊界、動態替換標題、document_start 時尚未出現 head、同步輸入事件檢查，以及欄位內容和輸入事件是否保留。DOM 測試不會操作 Windows V11，不能代替實際輸入法驗證。

發布包與 SHA-256 在 `dist/`。目前版本的變更見 [CHANGELOG](CHANGELOG.md)。

回報問題時，請提供 V11／瀏覽器版本、網站、分頁標題長度與重現步驟。避免公開當機檔、帳號資料或私人輸入內容。

## 授權

[MIT](LICENSE)。這是獨立開源相容工具，與自然輸入法廠商、X、Meta 或瀏覽器廠商無隸屬關係。
