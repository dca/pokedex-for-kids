package questions

import (
	"strconv"

	"game-api/internal/content"
	"game-api/internal/game/zhuyin"
)

// 聽音找符號：播放「ㄅ」，選出 ㄅ。
func buildListenSymbol(c *content.Content, in BuildInput, it Item) (Question, error) {
	if it.Kind != "sym" || !zhuyin.IsSymbol(it.Value) {
		return Question{}, ErrNotApplicable
	}
	opts := []Option{symbolOption(it.Value)}
	for _, d := range SymbolDistractors(c, it.Value, in.OptionCount-1, in.Rand) {
		opts = append(opts, symbolOption(d))
	}
	return Question{
		ItemIDs:       []string{SymItem(it.Value)},
		Prompt:        []PromptPart{prompt("listen-symbol"), audio("sym:" + it.Value)},
		Display:       Display{Layout: "none", Cells: []Cell{}, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{it.Value},
		AudioOnAnswer: "sym:" + it.Value,
	}, nil
}

// 名稱開頭音：「皮卡丘的第一個音是哪一個？」→ ㄆ。名稱不顯示注音，避免洩漏答案。
func buildFirstSound(c *content.Content, in BuildInput, it Item) (Question, error) {
	first, ok := firstHan(in.Pokemon)
	if it.Kind != "sym" || !ok || first.Initial == "" || first.Initial != it.Value {
		return Question{}, ErrNotApplicable
	}
	opts := []Option{symbolOption(it.Value)}
	for _, d := range SymbolDistractors(c, it.Value, in.OptionCount-1, in.Rand) {
		opts = append(opts, symbolOption(d))
	}
	return Question{
		ItemIDs:       []string{SymItem(it.Value)},
		Prompt:        []PromptPart{audio(nameAudio(in.Pokemon.ID)), prompt("first-sound"), text(in.Pokemon.Name + "的第一個音是哪一個？")},
		Display:       Display{Layout: "horizontal", Cells: nameCells(in.Pokemon, false), ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{it.Value},
		AudioOnAnswer: "sym:" + it.Value,
	}, nil
}

// 聽聲調：播放名稱中某個字的音（例如 ㄇㄚˇ），選出三聲；名稱沒有這個聲調時播放聲調示範。
func buildListenTone(c *content.Content, in BuildInput, it Item) (Question, error) {
	tone, err := strconv.Atoi(it.Value)
	if it.Kind != "tone" || err != nil || tone < 1 || tone > 5 {
		return Question{}, ErrNotApplicable
	}
	sound := "tone:" + it.Value
	for _, s := range in.Pokemon.Syllables {
		if s.IsHan && s.Tone == tone {
			sound = sylAudio(s.Zhuyin)
			break
		}
	}
	opts := []Option{toneOption(tone)}
	for _, d := range ToneDistractors(c, tone, in.OptionCount-1, in.Rand) {
		opts = append(opts, toneOption(d))
	}
	return Question{
		ItemIDs:       []string{ToneItem(tone)},
		Prompt:        []PromptPart{prompt("listen-tone"), audio(sound)},
		Display:       Display{Layout: "none", Cells: []Cell{}, ShowSpeaker: true},
		Options:       opts,
		Answer:        []string{it.Value},
		AudioOnAnswer: "tone:" + it.Value,
	}, nil
}
