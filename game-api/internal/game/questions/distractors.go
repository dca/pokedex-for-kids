package questions

import (
	"math/rand/v2"
	"slices"
	"strconv"

	"game-api/internal/content"
	"game-api/internal/game/zhuyin"
)

// pickWithPriority 先從 preferred 取（洗牌後），不足再從 pool 補（洗牌後），排除 skip 回傳 true 的項目。
func pickWithPriority[T comparable](preferred, pool []T, n int, skip func(T) bool, r *rand.Rand) []T {
	out := make([]T, 0, n)
	seen := map[T]bool{}
	for _, list := range [][]T{shuffled(preferred, r), shuffled(pool, r)} {
		for _, x := range list {
			if len(out) == n {
				return out
			}
			if seen[x] || skip(x) {
				continue
			}
			seen[x] = true
			out = append(out, x)
		}
	}
	return out
}

func shuffled[T any](xs []T, r *rand.Rand) []T {
	out := slices.Clone(xs)
	r.Shuffle(len(out), func(i, j int) { out[i], out[j] = out[j], out[i] })
	return out
}

func confusableSymbols(c *content.Content, s string) []string {
	var out []string
	for _, group := range c.Confusables.Symbols {
		if slices.Contains(group, s) {
			out = append(out, group...)
		}
	}
	return out
}

// SymbolDistractors 回傳 n 個干擾符號：先取易混淆的，再取同類（聲母一類、介音與韻母一類）。
func SymbolDistractors(c *content.Content, answer string, n int, r *rand.Rand) []string {
	var pool []string
	if zhuyin.Category(answer) == zhuyin.CategoryInitial {
		pool = zhuyin.Initials
	} else {
		pool = append(slices.Clone(zhuyin.Medials), zhuyin.Finals...)
	}
	return pickWithPriority(confusableSymbols(c, answer), pool, n, func(s string) bool { return s == answer }, r)
}

// ToneDistractors 回傳 n 個干擾聲調（含輕聲）。
func ToneDistractors(c *content.Content, answer, n int, r *rand.Rand) []int {
	var preferred []int
	for _, group := range c.Confusables.Tones {
		if slices.Contains(group, answer) {
			preferred = append(preferred, group...)
		}
	}
	return pickWithPriority(preferred, []int{1, 2, 3, 4, 5}, n, func(t int) bool { return t == answer }, r)
}

// CharDistractors 回傳 n 個干擾字：先取字形相近、再取其他寶可夢名稱的字；
// 排除與答案同音（讀音包含 zy）的字，以及讀音不明的字。
func CharDistractors(c *content.Content, answer, zy string, n int, exclude []string, r *rand.Rand) []string {
	var preferred []string
	for _, group := range c.Confusables.Chars {
		if slices.Contains(group, answer) {
			preferred = append(preferred, group...)
		}
	}
	skip := func(ch string) bool {
		readings, known := c.CharZhuyin[ch]
		return ch == answer || !known || slices.Contains(readings, zy) || slices.Contains(exclude, ch)
	}
	return pickWithPriority(preferred, c.HanChars, n, skip, r)
}

// NameDistractors 回傳 n 隻干擾的寶可夢：先取同一區的，排除名稱讀音相同的。
func NameDistractors(c *content.Content, answer content.Pokemon, n int, r *rand.Rand) []content.Pokemon {
	ids := func(ps []content.Pokemon) []int {
		out := make([]int, len(ps))
		for i, p := range ps {
			out[i] = p.ID
		}
		return out
	}
	skip := func(id int) bool { return id == answer.ID || c.Pokemon[id].Zhuyin() == answer.Zhuyin() }
	picked := pickWithPriority(ids(c.InZone(answer.Zone)), ids(c.PokemonList), n, skip, r)
	out := make([]content.Pokemon, len(picked))
	for i, id := range picked {
		out[i] = c.Pokemon[id]
	}
	return out
}

func symbolOption(s string) Option {
	return Option{ID: s, Label: s, Category: zhuyin.Category(s)}
}

func toneOption(t int) Option {
	return Option{ID: strconv.Itoa(t), Label: zhuyin.ToneMarks[t], Category: zhuyin.CategoryTone}
}
