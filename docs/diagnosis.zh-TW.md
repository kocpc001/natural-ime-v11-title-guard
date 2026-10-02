# 自然輸入法 V11～V13 長標題問題：V11 本機診斷紀錄

發現日期：2026-10-02。本文件區分本機證據、推論與仍待驗證的行為；尚無輸入法廠商的獨立確認。

2026-10-03 更新：使用者確認 V11、V12、V13 都有同樣的長標題相容問題，並回報 X、Threads 的輸入問題已解決。以下當機檔與反組譯數據來自 V11，不代表已另行分析 V12、V13 的二進位檔。Gmail 側邊 Gemini 欄位的間歇性失效仍未解決、原因尚未確認，另見[已知問題](known-issues.zh-TW.md)。

## 環境與症狀

安裝項目為「Natural Input Method Zhuyin Edition - 自然輸入法 V11 注音版」。系統為 Windows 11 25H2（build 26200.9550），瀏覽器為 Chrome 154.0.8037.58。

安裝套件 DisplayVersion 為 1.00.0000，GOImeServer11.exe 的 ProductVersion 為 11.1.0.0；兩者都是通用版本欄位，不能據此識別精確 V11 revision。受分析的 `OVIMGoing.dll` SHA-256：

```text
FC39CA461E09602F4B503AC9F100140C96741D4404CD909C4F0B988D22A65B80
```

使用者回報：記事本和其他 Chrome 頁面可輸入中文；特定 X 貼文回覆欄位不顯示確認後的中文，同一 Chrome 視窗的聊天側邊欄也可能失敗；切換其他頁面又正常。Threads 曾有類似症狀。

## 網頁接收紀錄

在一次使用者確認的 V11 失敗測試中，X 回覆欄位依序收到 compositionstart、compositionupdate、beforeinput、input，但組字資料只有一個空白。隨後 Windows 紀錄 GOImeServer11.exe 在 OVIMGoing.dll 當機，服務自動重啟；compositionend 最後仍是空字串。欄位保持焦點，確認後 100／500 毫秒的 DOM 也沒有中文字。

這次監看没有發現「中文字先寫入，再被網頁刪除」的過程。因此單純監聽網頁 compositionend 並轉貼，無法在該次失敗中取得完整文字。

另以 Chrome DevTools Protocol 直接送組字，在新開 X 與 Threads 編輯器中可顯示文字。此測試繞過 Windows V11，僅能證明這些編輯器具備接收中文的能力。在原故障 X 分頁，直接組字曾進入 DOM，但畫面仍空白，延遲後狀態未完整記錄，不能宣稱當時已修復。

## 當機檔與呼叫端

十份本機當機檔均出現：

| 項目 | 結果 |
| --- | --- |
| 程序 | GOImeServer11.exe |
| 模組 | OVIMGoing.dll |
| 例外 | 0xc0000409 |
| fast-fail 參數 | 2（stack cookie check failure） |
| 終止位置 | 模組相對位移 0x96cb8 |
| cookie 檢查呼叫的返回位置 | 模組相對位移 0x5fc5a |
| 呼叫端儲存的 wstring 長度 | 313 個 UTF-16 單位 |

離線檢查顯示，模組 `+0x5fb20` 的函式先取得前景視窗，再讀取該視窗標題：

| 程式位置／資料 | 本機觀察 |
| --- | --- |
| +0x5fb59 | 呼叫 GetForegroundWindow |
| +0x5fb81 | 傳入 nMaxCount = 0x258（600） |
| +0x5fb86 | 目的緩衝區地址為 EBP - 0x268 |
| +0x5fb8e | 呼叫 GetWindowTextW |
| cookie 位置 | EBP - 0x10 |
| +0x5fc55 | 呼叫 cookie 檢查函式 |
| +0x96cb8 | int 0x29 終止 |

目的緩衝區起點到 cookie 的距離為 `0x268 - 0x10 = 0x258`，即 **600 位元組、300 個 UTF-16 單位**。GetWindowTextW 的 nMaxCount 則以字元數（包含終止符）計算。呼叫端卻給了 600 個字元的上限，超出這段堆疊緩衝区的實際容量。[Microsoft API 文件](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw)

十份 dump 的區域 wstring 長度欄位皆為 313，並在這個函式的 cookie 檢查失敗。同時，當時 X 的 document.title 實測為 297 個 UTF-16 單位，與視窗標題長度相差 16，符合 Chrome 標題後綴。這些證據強烈指向長標題寫入造成堆疊緩衝區越界。

注意：dump 中緩衝區第一個零值出現在第 306 單位，不代表原始標題長度。函式尾端已還原 SEH 指標，改寫了同一區域；313 來自未受該尾端還原影響的 wstring 長度欄位。

原始當機檔、恢復的標題／記憶體內容、私人測試頁截圖与輸入資料不公開。本文只保留重現此推論所需的數值與模組相對位移。

## 修正與驗證狀態

相容腳本將長 document.title 截短為最多 180 個 UTF-16 單位，保留瀏覽器標題後綴空間，並監看之後的標題變化。此做法改變頁面標題，不修改輸入法引擎或輸入欄位。

已在原故障 X 分頁暫時執行腳本，標題由 297 縮為 180。六項真實 Chrome DOM 測試通過：短標題保留、313 單位標題截短、emoji 邊界、更換 title 節點、keydown 同步處理、欄位內容保留。公開專案另提供可重跑的自動化 DOM 測試。

使用者先回報「應該是解決了」，後續明確確認 X、Threads 的輸入問題已解決，並確認 V11～V13 都有同樣問題。這是使用者的實際輸入回報；公開自動化測試只驗證外掛的 DOM 行為，不能代替各版本的原生輸入法測試。

仍待更多驗證：不同 revision、瀏覽器視窗後綴與更廣泛的使用環境，以及 V12、V13 的獨立二進位分析。此處解法不涵蓋與長標題無關的輸入問題。

## 為什麼側邊欄也會受影響？

當機路徑讀取的是**前景視窗標題**，不是只分析正在輸入的 HTML 編輯器。因此，只要前景 Chrome 視窗因目前分頁而具有長標題，在這個視窗的其他輸入區域組字，也可能觸發同一條 V11 程式路徑。這是根據本機證據的機制推論，仍待更多獨立重現。

## 限制與回復方式

180 是保守的分頁標題上限，不保證任何任意自訂瀏覽器後綴或其他程式視窗都在 300 單位以内。MutationObserver 於微任務執行，focusin／keydown／compositionstart 的同步檢查用來補強輸入前的處理，仍無法消除所有原生程序與網頁標題更新的時序差異。

只在指定網站頂層執行；未匹配網站不會處理。停用外掛并重新載入網站會恢復原標題。這個修正不能處理與長視窗標題無關的引擎當機、TSF 状態或網頁編輯器問題。

## 參考資料

- [GetWindowTextW：nMaxCount 的單位與終止符規則](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowtextw)
- [Chrome 內容腳本：指定網站執行與隔離環境](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [MSVC __fastfail：0xc0000409 的不可繼續例外](https://learn.microsoft.com/en-us/cpp/intrinsics/fastfail)
