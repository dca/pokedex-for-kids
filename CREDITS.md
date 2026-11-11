# 素材來源與授權

## 注音符號發音（真人錄音）

37 個注音符號的發音（`pokedex-for-kids-web/data/audio/overrides/sym/`，轉成 mp3 並裁掉前後靜音）：

- 2017 © 教育部，國語注音符號手冊-開放部件。
- 此素材依「創用CC 姓名標示 4.0 國際版本」授權條款進行公眾釋出，使用者於遵守本條款各項規定之前提下，得利用之。
- 創用CC 姓名標示 4.0 國際版授權條款：https://creativecommons.org/licenses/by/4.0/deed.zh_TW
- 來源：https://language.moe.gov.tw/001/Upload/files/site_content/M0001/juyin/index.html

## 名稱音節與聲調示範（真人錄音）

188 個名稱音節與 5 個聲調示範（媽、麻、馬、罵、嗎）的發音（`pokedex-for-kids-web/data/audio/overrides/syl/`、`overrides/tone/`），取自單字屬性聲音檔中該字的字音（檔案的第一段；不更改讀音，只轉成 mp3）：

- 中華民國教育部（Ministry of Education, R.O.C.）。《國語辭典簡編本》（版本編號：2014_20260929）網址：http://dict.concised.moe.edu.tw/
- 採「創用CC－姓名標示－禁止改作 臺灣 3.0 版授權條款」釋出：http://creativecommons.org/licenses/by-nd/3.0/tw/legalcode
- 依授權要求完整保留之使用說明：[`licenses/moe-conciseddict-usage-10312.pdf`](licenses/moe-conciseddict-usage-10312.pdf)
- 每個音節使用的字記錄在 `pokedex-for-kids-web/data/audio/moe-syllable-chars.json`。名稱裡的字在簡編本中沒有錄音時，改用同一讀音的其他字（優先挑只有一種讀音的字），共 11 個：

| 音節 | 名稱裡的字 | 改用 |
|---|---|---|
| ˙ㄅㄚ | 叭 | 吧 |
| ㄅㄨˋ | 布 | 怖 |
| ㄇㄨˇ | 母 | 坶 |
| ㄉㄚˊ | 達 | 妲 |
| ㄊㄧㄢ | 天 | 添 |
| ㄏㄨㄚ | 花 | 化 |
| ㄐㄧㄠˇ | 角 | 佼 |
| ㄐㄩˊ | 菊 | 局 |
| ㄔㄠ | 超 | 抄 |
| ㄔㄨㄣˊ | 唇 | 純 |
| ㄧㄝ | 椰 | 噎 |

- 重新產生：下載簡編本的文字資料庫與單字屬性聲音檔後，依序執行 `scripts/moe-audio/map_syllables.py`、`scripts/moe-audio/extract_syllables.py`，再執行 `npm run audio`。

## 其他語音

提示語與寶可夢中英文名稱的發音，以 Google Cloud Text-to-Speech（cmn-TW、en-US）產生。

## 字型

jf open 粉圓（justfont），SIL Open Font License 1.1：https://github.com/justfont/open-huninn-font

## 寶可夢

寶可夢的名稱與圖片為 Nintendo、Creatures、GAME FREAK 所有。本專案是非營利的粉絲作品，不收費、不放廣告；權利人要求時會下架或更換相關素材。圖片取自 PokeAPI sprites（https://github.com/PokeAPI/sprites）。
