package questions

import (
	"strconv"
	"strings"

	"game-api/internal/content"
	"game-api/internal/game/zhuyin"
)

// 補符號：ㄑ＿ㄡ，選出 ㄧ。
func buildFillSymbol(c *content.Content, in BuildInput, it Item) (Question, error) {
	idx := indexOfSyllable(in.Pokemon, it.Value)
	if it.Kind != "syl" || idx < 0 {
		return Question{}, ErrNotApplicable
	}
	s := in.Pokemon.Syllables[idx].Parsed()
	symbols := s.Symbols()
	answer := symbols[in.Rand.IntN(len(symbols))]
	masked := zhuyin.Syllable{Initial: s.Initial, Medial: s.Medial, Final: s.Final, Tone: s.Tone}
	switch answer {
	case s.Initial:
		masked.Initial = Blank
	case s.Medial:
		masked.Medial = Blank
	default:
		masked.Final = Blank
	}
	cells := nameCells(in.Pokemon, true)
	cells[idx].Zhuyin = strPtr(formatMasked(masked))
	cells[idx].Blank = "symbol"

	opts := []Option{symbolOption(answer)}
	for _, d := range SymbolDistractors(c, answer, in.OptionCount-1, in.Rand) {
		opts = append(opts, symbolOption(d))
	}
	return Question{
		ItemIDs:       []string{SylItem(it.Value), SymItem(answer)},
		Prompt:        []PromptPart{prompt("fill-symbol"), audio(sylAudio(it.Value))},
		Display:       Display{Layout: "horizontal", Cells: cells, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{answer},
		AudioOnAnswer: sylAudio(it.Value),
	}, nil
}

// 補聲調：ㄎㄚ＿，選出 ˇ。一聲在最後補空格、輕聲在最前面。
func buildFillTone(c *content.Content, in BuildInput, it Item) (Question, error) {
	idx := indexOfSyllable(in.Pokemon, it.Value)
	if it.Kind != "syl" || idx < 0 {
		return Question{}, ErrNotApplicable
	}
	s := in.Pokemon.Syllables[idx].Parsed()
	shown := s.Body() + Blank
	if s.Tone == 5 {
		shown = Blank + s.Body()
	}
	cells := nameCells(in.Pokemon, true)
	cells[idx].Zhuyin = strPtr(shown)
	cells[idx].Blank = "tone"

	opts := []Option{toneOption(s.Tone)}
	for _, d := range ToneDistractors(c, s.Tone, in.OptionCount-1, in.Rand) {
		opts = append(opts, toneOption(d))
	}
	return Question{
		ItemIDs:       []string{SylItem(it.Value), ToneItem(s.Tone)},
		Prompt:        []PromptPart{prompt("fill-tone"), audio(sylAudio(it.Value))},
		Display:       Display{Layout: "horizontal", Cells: cells, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{strconv.Itoa(s.Tone)},
		AudioOnAnswer: sylAudio(it.Value),
	}, nil
}

// 拼音節：聽「卡」，依序把 ㄎ、ㄚ、ˇ 放進格子。選項是音節的符號（含聲調）加上兩個干擾符號。
func buildSyllable(c *content.Content, in BuildInput, it Item) (Question, error) {
	idx := indexOfSyllable(in.Pokemon, it.Value)
	if it.Kind != "syl" || idx < 0 {
		return Question{}, ErrNotApplicable
	}
	s := in.Pokemon.Syllables[idx].Parsed()
	tiles := s.Symbols()
	if len(tiles) < 2 {
		return Question{}, ErrNotApplicable
	}
	switch s.Tone {
	case 5:
		tiles = append([]string{"˙"}, tiles...)
	case 1:
	default:
		tiles = append(tiles, zhuyin.ToneMarks[s.Tone])
	}
	opts := make([]Option, 0, len(tiles)+2)
	for _, t := range tiles {
		opts = append(opts, tileOption(t))
	}
	// 干擾符號：取第一個符號的易混淆符號，避免與既有方塊重複
	var extra []string
	for _, sym := range s.Symbols() {
		for _, d := range SymbolDistractors(c, sym, 4, in.Rand) {
			if !containsStr(tiles, d) && !containsStr(extra, d) && len(extra) < 2 {
				extra = append(extra, d)
			}
		}
	}
	for _, d := range extra {
		opts = append(opts, tileOption(d))
	}
	cells := nameCells(in.Pokemon, true)
	cells[idx].Zhuyin = strPtr(strings.Repeat(Blank, len(tiles)))
	cells[idx].Blank = "syllable"
	return Question{
		ItemIDs:       []string{SylItem(it.Value)},
		Prompt:        []PromptPart{prompt("build-syllable"), audio(sylAudio(it.Value))},
		Display:       Display{Layout: "horizontal", Cells: cells, ShowSpeaker: true},
		Options:       opts,
		Answer:        tiles,
		AudioOnAnswer: sylAudio(it.Value),
	}, nil
}

func tileOption(t string) Option {
	return Option{ID: t, Label: t, Category: zhuyin.Category(t)}
}

// formatMasked 依顯示順序組出含「＿」的注音。
func formatMasked(s zhuyin.Syllable) string {
	body := s.Initial + s.Medial + s.Final
	switch s.Tone {
	case 5:
		return "˙" + body
	case 1:
		return body
	}
	return body + zhuyin.ToneMarks[s.Tone]
}

func containsStr(xs []string, x string) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}
