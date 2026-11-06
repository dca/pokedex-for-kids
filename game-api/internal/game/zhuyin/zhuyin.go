// Package zhuyin 解析注音音節，並提供符號分類。
// 規則與前端 src/game/zhuyin.ts 相同，兩邊的測試案例保持一致。
package zhuyin

import (
	"fmt"
	"strings"
)

// Syllable 是拆開後的注音音節；Tone 為 1～5，5 代表輕聲。
type Syllable struct {
	Initial string
	Medial  string
	Final   string
	Tone    int
}

const (
	CategoryInitial = "initial"
	CategoryMedial  = "medial"
	CategoryFinal   = "final"
	CategoryTone    = "tone"
)

var (
	Initials = strings.Split("ㄅㄆㄇㄈㄉㄊㄋㄌㄍㄎㄏㄐㄑㄒㄓㄔㄕㄖㄗㄘㄙ", "")
	Medials  = strings.Split("ㄧㄨㄩ", "")
	Finals   = strings.Split("ㄚㄛㄜㄝㄞㄟㄠㄡㄢㄣㄤㄥㄦ", "")

	// ToneMarks 是各聲調顯示用的符號；一聲本身沒有標記，顯示時用 ˉ。
	ToneMarks = map[int]string{1: "ˉ", 2: "ˊ", 3: "ˇ", 4: "ˋ", 5: "˙"}

	initialSet = toSet(Initials)
	medialSet  = toSet(Medials)
	finalSet   = toSet(Finals)
	toneByMark = map[string]int{"ˊ": 2, "ˇ": 3, "ˋ": 4}
)

func toSet(xs []string) map[string]bool {
	m := make(map[string]bool, len(xs))
	for _, x := range xs {
		m[x] = true
	}
	return m
}

// Category 回傳符號的分類；不是注音符號時回傳空字串。
func Category(symbol string) string {
	switch {
	case initialSet[symbol]:
		return CategoryInitial
	case medialSet[symbol]:
		return CategoryMedial
	case finalSet[symbol]:
		return CategoryFinal
	case symbol == "ˉ" || symbol == "˙" || toneByMark[symbol] != 0:
		return CategoryTone
	}
	return ""
}

// IsSymbol 回傳是否為 37 個注音符號之一（不含聲調）。
func IsSymbol(s string) bool {
	return initialSet[s] || medialSet[s] || finalSet[s]
}

// Parse 把「ㄑㄧㄡ」「˙ㄉㄜ」這類音節拆開。
func Parse(input string) (Syllable, error) {
	rest := strings.Split(input, "")
	s := Syllable{Tone: 1}
	if len(rest) > 0 && rest[0] == "˙" {
		s.Tone = 5
		rest = rest[1:]
	} else if n := len(rest); n > 0 && toneByMark[rest[n-1]] != 0 {
		s.Tone = toneByMark[rest[n-1]]
		rest = rest[:n-1]
	}
	i := 0
	if i < len(rest) && initialSet[rest[i]] {
		s.Initial = rest[i]
		i++
	}
	if i < len(rest) && medialSet[rest[i]] {
		s.Medial = rest[i]
		i++
	}
	if i < len(rest) && finalSet[rest[i]] {
		s.Final = rest[i]
		i++
	}
	if i == 0 || i != len(rest) {
		return Syllable{}, fmt.Errorf("不合法的注音音節：%q", input)
	}
	return s, nil
}

// MustParse 用於已驗證過的靜態內容。
func MustParse(input string) Syllable {
	s, err := Parse(input)
	if err != nil {
		panic(err)
	}
	return s
}

// Body 回傳不含聲調的符號串。
func (s Syllable) Body() string { return s.Initial + s.Medial + s.Final }

// Symbols 回傳不含聲調、依順序排列的符號。
func (s Syllable) Symbols() []string {
	var out []string
	for _, x := range []string{s.Initial, s.Medial, s.Final} {
		if x != "" {
			out = append(out, x)
		}
	}
	return out
}

// Format 是 Parse 的反函數。
func Format(s Syllable) string {
	switch s.Tone {
	case 5:
		return "˙" + s.Body()
	case 1:
		return s.Body()
	default:
		return s.Body() + ToneMarks[s.Tone]
	}
}

// Size 回傳不含聲調的符號數：1 一拼、2 二拼、3 三拼。
func Size(s Syllable) int { return len(s.Symbols()) }
