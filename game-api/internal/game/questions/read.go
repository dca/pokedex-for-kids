package questions

import (
	"game-api/internal/content"
)

// 聽音選名稱：播放「皮卡丘」，從幾組名稱選出正確的。
func buildListenName(c *content.Content, in BuildInput, it Item) (Question, error) {
	if it.Kind != "char" || indexOfChar(in.Pokemon, it.Value) < 0 {
		return Question{}, ErrNotApplicable
	}
	opts := []Option{{ID: pokemonOptionID(in.Pokemon.ID), Label: in.Pokemon.Name}}
	for _, p := range NameDistractors(c, in.Pokemon, in.OptionCount-1, in.Rand) {
		opts = append(opts, Option{ID: pokemonOptionID(p.ID), Label: p.Name})
	}
	return Question{
		ItemIDs:       []string{CharItem(it.Value)},
		Prompt:        []PromptPart{prompt("listen-name"), audio(nameAudio(in.Pokemon.ID))},
		Display:       Display{Layout: "none", Cells: []Cell{}, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{pokemonOptionID(in.Pokemon.ID)},
		AudioOnAnswer: nameAudio(in.Pokemon.ID),
	}, nil
}

// 看注音選字：看到 ㄎㄚˇ，選出「卡」。以課本式直排顯示。
func buildZhuyinToChar(c *content.Content, in BuildInput, it Item) (Question, error) {
	idx := indexOfChar(in.Pokemon, it.Value)
	if it.Kind != "char" || idx < 0 {
		return Question{}, ErrNotApplicable
	}
	zy := in.Pokemon.Syllables[idx].Zhuyin
	opts := []Option{{ID: it.Value, Label: it.Value}}
	for _, d := range CharDistractors(c, it.Value, zy, in.OptionCount-1, nil, in.Rand) {
		opts = append(opts, Option{ID: d, Label: d})
	}
	return Question{
		ItemIDs:       []string{CharItem(it.Value)},
		Prompt:        []PromptPart{prompt("zhuyin-to-char"), audio(sylAudio(zy))},
		Display:       Display{Layout: "vertical", Cells: []Cell{{Char: nil, Zhuyin: strPtr(zy), Blank: "char"}}, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{it.Value},
		AudioOnAnswer: sylAudio(zy),
	}, nil
}

// 補缺字：皮＿丘（缺字旁仍顯示注音），從「卡、下、卞」中選出正確的字。
func buildFillChar(c *content.Content, in BuildInput, it Item) (Question, error) {
	idx := indexOfChar(in.Pokemon, it.Value)
	if it.Kind != "char" || idx < 0 {
		return Question{}, ErrNotApplicable
	}
	zy := in.Pokemon.Syllables[idx].Zhuyin
	cells := nameCells(in.Pokemon, true)
	cells[idx].Char = nil
	cells[idx].Blank = "char"
	// 名稱中其他的字不當干擾項，避免小朋友直接從畫面上找
	var others []string
	for _, s := range in.Pokemon.Syllables {
		others = append(others, s.Char)
	}
	opts := []Option{{ID: it.Value, Label: it.Value}}
	for _, d := range CharDistractors(c, it.Value, zy, in.OptionCount-1, others, in.Rand) {
		opts = append(opts, Option{ID: d, Label: d})
	}
	return Question{
		ItemIDs:       []string{CharItem(it.Value)},
		Prompt:        []PromptPart{prompt("fill-char"), audio(nameAudio(in.Pokemon.ID))},
		Display:       Display{Layout: "vertical", Cells: cells, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{it.Value},
		AudioOnAnswer: nameAudio(in.Pokemon.ID),
	}, nil
}
