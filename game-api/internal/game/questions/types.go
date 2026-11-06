// Package questions 產生 9 種題型的題目與干擾選項（FR-010、FR-016、FR-037）。
// 結構的 JSON 欄位與 openapi.yaml 的 Question 相同，可以直接存進資料庫並回傳給前端。
package questions

import (
	"errors"
	"fmt"
	"strings"

	"game-api/internal/content"
)

const (
	ListenSymbol  = "listen_symbol"
	FirstSound    = "first_sound"
	ListenTone    = "listen_tone"
	FillSymbol    = "fill_symbol"
	FillTone      = "fill_tone"
	BuildSyllable = "build_syllable"
	ListenName    = "listen_name"
	ZhuyinToChar  = "zhuyin_to_char"
	FillChar      = "fill_char"
)

// Blank 是挖空位置的顯示符號。
const Blank = "＿"

type PromptPart struct {
	Kind     string `json:"kind"`
	AudioKey string `json:"audioKey,omitempty"`
	Text     string `json:"text,omitempty"`
}

type Cell struct {
	Char   *string `json:"char"`
	Zhuyin *string `json:"zhuyin"`
	Blank  string  `json:"blank"`
}

type Display struct {
	Layout      string `json:"layout"`
	Cells       []Cell `json:"cells"`
	ShowSpeaker bool   `json:"showSpeaker"`
}

type Option struct {
	ID       string `json:"id"`
	Label    string `json:"label"`
	Category string `json:"category,omitempty"`
}

type Question struct {
	Type          string       `json:"type"`
	PokemonID     int          `json:"pokemonId"`
	ItemIDs       []string     `json:"itemIds"`
	Prompt        []PromptPart `json:"prompt"`
	Display       Display      `json:"display"`
	Options       []Option     `json:"options"`
	Answer        []string     `json:"answer"`
	AudioOnAnswer string       `json:"audioOnAnswer,omitempty"`
}

// ErrNotApplicable 表示這隻寶可夢的名稱無法出這種題目。
var ErrNotApplicable = errors.New("這隻寶可夢無法出這個題目")

// Item 是拆開的學習項目 ID。
type Item struct {
	Kind  string // sym、tone、syl、char
	Value string
}

func ParseItem(id content.ItemID) Item {
	s := string(id)
	i := strings.IndexByte(s, ':')
	if i < 0 {
		return Item{}
	}
	return Item{Kind: s[:i], Value: s[i+1:]}
}

func SymItem(s string) string  { return "sym:" + s }
func ToneItem(t int) string    { return fmt.Sprintf("tone:%d", t) }
func SylItem(zy string) string { return "syl:" + zy }
func CharItem(c string) string { return "char:" + c }

func prompt(key string) PromptPart   { return PromptPart{Kind: "audio", AudioKey: "prompt:" + key} }
func audio(key string) PromptPart    { return PromptPart{Kind: "audio", AudioKey: key} }
func text(t string) PromptPart       { return PromptPart{Kind: "text", Text: t} }
func nameAudio(id int) string        { return fmt.Sprintf("name:zh:%d", id) }
func sylAudio(zy string) string      { return "syl:" + zy }
func strPtr(s string) *string        { return &s }
func pokemonOptionID(id int) string  { return fmt.Sprintf("p%d", id) }
