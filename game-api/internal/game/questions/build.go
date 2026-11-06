package questions

import (
	"fmt"
	"math/rand/v2"
	"slices"

	"game-api/internal/content"
)

type BuildInput struct {
	Type        string
	Pokemon     content.Pokemon
	Target      content.ItemID
	OptionCount int
	Rand        *rand.Rand
}

// Build 依題型產生一道題目。名稱無法出這種題時回傳 ErrNotApplicable。
func Build(c *content.Content, in BuildInput) (Question, error) {
	if in.OptionCount < 2 {
		in.OptionCount = 2
	}
	item := ParseItem(in.Target)
	var (
		q   Question
		err error
	)
	switch in.Type {
	case ListenSymbol:
		q, err = buildListenSymbol(c, in, item)
	case FirstSound:
		q, err = buildFirstSound(c, in, item)
	case ListenTone:
		q, err = buildListenTone(c, in, item)
	case FillSymbol:
		q, err = buildFillSymbol(c, in, item)
	case FillTone:
		q, err = buildFillTone(c, in, item)
	case BuildSyllable:
		q, err = buildSyllable(c, in, item)
	case ListenName:
		q, err = buildListenName(c, in, item)
	case ZhuyinToChar:
		q, err = buildZhuyinToChar(c, in, item)
	case FillChar:
		q, err = buildFillChar(c, in, item)
	default:
		return Question{}, fmt.Errorf("未知的題型 %q", in.Type)
	}
	if err != nil {
		return Question{}, err
	}
	q.Type = in.Type
	q.PokemonID = in.Pokemon.ID
	in.Rand.Shuffle(len(q.Options), func(i, j int) { q.Options[i], q.Options[j] = q.Options[j], q.Options[i] })
	return q, nil
}

// TypesFor 回傳這個項目搭配這隻寶可夢可以出的題型（依 allowed 的順序）。
func TypesFor(item content.ItemID, p content.Pokemon, allowed []string) []string {
	it := ParseItem(item)
	var out []string
	for _, t := range allowed {
		if applicable(t, it, p) {
			out = append(out, t)
		}
	}
	return out
}

func applicable(t string, it Item, p content.Pokemon) bool {
	switch t {
	case ListenSymbol:
		return it.Kind == "sym"
	case FirstSound:
		first, ok := firstHan(p)
		return it.Kind == "sym" && ok && first.Initial == it.Value
	case ListenTone:
		return it.Kind == "tone"
	case FillSymbol, FillTone:
		return it.Kind == "syl" && indexOfSyllable(p, it.Value) >= 0
	case BuildSyllable:
		i := indexOfSyllable(p, it.Value)
		return it.Kind == "syl" && i >= 0 && len(p.Syllables[i].Parsed().Symbols()) >= 2
	case ListenName, ZhuyinToChar, FillChar:
		return it.Kind == "char" && indexOfChar(p, it.Value) >= 0
	}
	return false
}

// Contains 回傳寶可夢的名稱是否包含這個項目（用於依弱點挑選寶可夢，FR-035）。
func Contains(p content.Pokemon, item content.ItemID) bool {
	it := ParseItem(item)
	for _, s := range p.Syllables {
		if !s.IsHan {
			continue
		}
		switch it.Kind {
		case "sym":
			if s.Initial == it.Value || s.Medial == it.Value || s.Final == it.Value {
				return true
			}
		case "tone":
			if fmt.Sprint(s.Tone) == it.Value {
				return true
			}
		case "syl":
			if s.Zhuyin == it.Value {
				return true
			}
		case "char":
			if s.Char == it.Value {
				return true
			}
		}
	}
	return false
}

// IsAlsoCorrect 回傳選項是否會被視為正確（答案本身也回傳 true）。干擾項必須全部回傳 false。
func IsAlsoCorrect(c *content.Content, q Question, optionID string) bool {
	if slices.Contains(q.Answer, optionID) {
		return true
	}
	switch q.Type {
	case ZhuyinToChar, FillChar:
		target := ""
		for _, cell := range q.Display.Cells {
			if cell.Blank == "char" && cell.Zhuyin != nil {
				target = *cell.Zhuyin
			}
		}
		return slices.Contains(c.CharZhuyin[optionID], target)
	case ListenName:
		var answer, option content.Pokemon
		for _, p := range c.PokemonList {
			if pokemonOptionID(p.ID) == q.Answer[0] {
				answer = p
			}
			if pokemonOptionID(p.ID) == optionID {
				option = p
			}
		}
		return option.ID != 0 && option.Zhuyin() == answer.Zhuyin()
	}
	return false
}

func firstHan(p content.Pokemon) (content.Syllable, bool) {
	for _, s := range p.Syllables {
		if s.IsHan {
			return s, true
		}
	}
	return content.Syllable{}, false
}

func indexOfSyllable(p content.Pokemon, zy string) int {
	for i, s := range p.Syllables {
		if s.IsHan && s.Zhuyin == zy {
			return i
		}
	}
	return -1
}

func indexOfChar(p content.Pokemon, ch string) int {
	for i, s := range p.Syllables {
		if s.IsHan && s.Char == ch {
			return i
		}
	}
	return -1
}

// nameCells 產生名稱的顯示格；showZhuyin 為 false 時不顯示任何注音（避免洩漏答案）。
func nameCells(p content.Pokemon, showZhuyin bool) []Cell {
	cells := make([]Cell, len(p.Syllables))
	for i, s := range p.Syllables {
		cells[i] = Cell{Char: strPtr(s.Char), Blank: "none"}
		if showZhuyin && s.IsHan {
			cells[i].Zhuyin = strPtr(s.Zhuyin)
		}
	}
	return cells
}
