package questions

import (
	"encoding/json"
	"fmt"
	"math/rand/v2"
	"slices"
	"strings"
	"testing"

	"game-api/internal/content"
	"game-api/internal/game/zhuyin"
)

var c = content.MustLoad()

func rng(seed uint64) *rand.Rand { return rand.New(rand.NewPCG(seed, 99)) }

// allItems 列出某隻寶可夢的名稱涵蓋的所有學習項目。
func allItems(p content.Pokemon) []content.ItemID {
	var out []content.ItemID
	for _, s := range p.Syllables {
		if !s.IsHan {
			continue
		}
		for _, sym := range s.Parsed().Symbols() {
			out = append(out, content.ItemID(SymItem(sym)))
		}
		out = append(out, content.ItemID(ToneItem(s.Tone)), content.ItemID(SylItem(s.Zhuyin)), content.ItemID(CharItem(s.Char)))
	}
	return out
}

var allTypes = []string{ListenSymbol, FirstSound, ListenTone, FillSymbol, FillTone, BuildSyllable, ListenName, ZhuyinToChar, FillChar}

// 對 151 隻寶可夢、每個可出的項目與題型，檢查所有共同規則。
func TestInvariantsAcrossGen1(t *testing.T) {
	built := 0
	for _, p := range c.PokemonList {
		for _, item := range allItems(p) {
			for _, typ := range TypesFor(item, p, allTypes) {
				for n := 2; n <= 4; n++ {
					q, err := Build(c, BuildInput{Type: typ, Pokemon: p, Target: item, OptionCount: n, Rand: rng(uint64(p.ID*10 + n))})
					if err != nil {
						t.Fatalf("#%d %s %s %s：%v", p.ID, p.Name, typ, item, err)
					}
					checkInvariants(t, p, item, n, q)
					built++
				}
			}
		}
	}
	if built < 1000 {
		t.Fatalf("只產生了 %d 題", built)
	}
}

func checkInvariants(t *testing.T, p content.Pokemon, item content.ItemID, n int, q Question) {
	t.Helper()
	where := fmt.Sprintf("#%d %s %s %s", p.ID, p.Name, q.Type, item)
	ids := make([]string, len(q.Options))
	for i, o := range q.Options {
		ids[i] = o.ID
	}
	if len(slices.Compact(slices.Sorted(slices.Values(ids)))) != len(ids) {
		t.Errorf("%s：選項重複 %v", where, ids)
	}
	for _, a := range q.Answer {
		if !slices.Contains(ids, a) {
			t.Errorf("%s：選項 %v 不含答案 %s", where, ids, a)
		}
	}
	if q.Type != BuildSyllable && len(q.Options) != n {
		t.Errorf("%s：選項數 %d，想要 %d", where, len(q.Options), n)
	}
	for _, o := range q.Options {
		if !slices.Contains(q.Answer, o.ID) && IsAlsoCorrect(c, q, o.ID) {
			t.Errorf("%s：干擾項 %s 也是正確答案", where, o.ID)
		}
	}
	if !slices.Contains(q.ItemIDs, string(item)) {
		t.Errorf("%s：itemIds %v 不含目標", where, q.ItemIDs)
	}
	if q.PokemonID != p.ID || len(q.Prompt) == 0 || q.AudioOnAnswer == "" {
		t.Errorf("%s：缺少 pokemonId、prompt 或 audioOnAnswer", where)
	}
	checkNoLeak(t, where, q)
}

// FR-016：題目畫面不得洩漏答案。
func checkNoLeak(t *testing.T, where string, q Question) {
	t.Helper()
	switch q.Type {
	case ListenSymbol, ListenTone, ListenName:
		if q.Display.Layout != "none" || len(q.Display.Cells) != 0 {
			t.Errorf("%s：聽音題不應顯示文字", where)
		}
	case FirstSound:
		for _, cell := range q.Display.Cells {
			if cell.Zhuyin != nil {
				t.Errorf("%s：開頭音題不可顯示注音", where)
			}
		}
	case FillSymbol, FillTone, BuildSyllable:
		blanks := 0
		for _, cell := range q.Display.Cells {
			if cell.Blank == "none" {
				continue
			}
			blanks++
			if cell.Zhuyin == nil || !strings.Contains(*cell.Zhuyin, Blank) {
				t.Errorf("%s：挖空位置沒有「＿」", where)
			}
		}
		if blanks != 1 {
			t.Errorf("%s：挖空數 %d", where, blanks)
		}
	case ZhuyinToChar, FillChar:
		for _, cell := range q.Display.Cells {
			if cell.Blank == "char" && cell.Char != nil {
				t.Errorf("%s：缺字位置顯示了字", where)
			}
		}
		if q.Display.Layout != "vertical" {
			t.Errorf("%s：認字題應為直排", where)
		}
	}
}

func TestFirstSoundPikachu(t *testing.T) {
	q, err := Build(c, BuildInput{Type: FirstSound, Pokemon: c.Pokemon[25], Target: "sym:ㄆ", OptionCount: 3, Rand: rng(1)})
	if err != nil {
		t.Fatal(err)
	}
	if q.Answer[0] != "ㄆ" || q.Prompt[0].AudioKey != "name:zh:25" || q.Prompt[1].AudioKey != "prompt:first-sound" {
		t.Fatalf("%+v", q)
	}
	// 易混淆的 ㄅ 或 ㄉ 應優先出現
	labels := []string{q.Options[0].ID, q.Options[1].ID, q.Options[2].ID}
	if !slices.Contains(labels, "ㄅ") && !slices.Contains(labels, "ㄉ") {
		t.Fatalf("干擾項沒有優先取易混淆的符號：%v", labels)
	}
	// 開頭不是 ㄆ 的寶可夢不能出這題
	if _, err := Build(c, BuildInput{Type: FirstSound, Pokemon: c.Pokemon[1], Target: "sym:ㄆ", OptionCount: 2, Rand: rng(1)}); err == nil {
		t.Fatal("妙蛙種子不應能出 ㄆ 的開頭音題")
	}
}

func TestListenToneIncludesNeutral(t *testing.T) {
	seen := map[string]bool{}
	for seed := uint64(0); seed < 50; seed++ {
		q, _ := Build(c, BuildInput{Type: ListenTone, Pokemon: c.Pokemon[25], Target: "tone:3", OptionCount: 4, Rand: rng(seed)})
		for _, o := range q.Options {
			seen[o.ID] = true
		}
	}
	if !seen["5"] {
		t.Fatal("聽聲調題的選項應包含輕聲")
	}
}

func TestFillToneMarks(t *testing.T) {
	q, _ := Build(c, BuildInput{Type: FillTone, Pokemon: c.Pokemon[25], Target: "syl:ㄎㄚˇ", OptionCount: 3, Rand: rng(1)})
	if got := *q.Display.Cells[1].Zhuyin; got != "ㄎㄚ＿" {
		t.Fatalf("顯示 %q", got)
	}
	if q.Answer[0] != "3" {
		t.Fatalf("答案 %v", q.Answer)
	}
	if !slices.Contains(q.ItemIDs, "tone:3") {
		t.Fatal("應同時練到聲調")
	}
}

func TestBuildSyllableOrder(t *testing.T) {
	q, _ := Build(c, BuildInput{Type: BuildSyllable, Pokemon: c.Pokemon[25], Target: "syl:ㄑㄧㄡ", OptionCount: 4, Rand: rng(1)})
	if fmt.Sprint(q.Answer) != "[ㄑ ㄧ ㄡ]" {
		t.Fatalf("答案順序 %v", q.Answer)
	}
	if len(q.Options) != 5 {
		t.Fatalf("選項應為 3 個方塊加 2 個干擾：%d", len(q.Options))
	}
	q2, _ := Build(c, BuildInput{Type: BuildSyllable, Pokemon: c.Pokemon[25], Target: "syl:ㄎㄚˇ", OptionCount: 4, Rand: rng(1)})
	if fmt.Sprint(q2.Answer) != "[ㄎ ㄚ ˇ]" {
		t.Fatalf("聲調方塊應在最後：%v", q2.Answer)
	}
}

func TestCharDistractorsExcludeHomophones(t *testing.T) {
	for _, ch := range c.HanChars {
		zy := c.CharZhuyin[ch][0]
		for _, d := range CharDistractors(c, ch, zy, 6, nil, rng(3)) {
			if slices.Contains(c.CharZhuyin[d], zy) {
				t.Fatalf("%s（%s）的干擾字 %s 同音", ch, zy, d)
			}
		}
	}
}

func TestSymbolDistractorsPreferConfusables(t *testing.T) {
	got := SymbolDistractors(c, "ㄅ", 2, rng(5))
	for _, d := range got {
		if d != "ㄆ" && d != "ㄉ" {
			t.Fatalf("ㄅ 的前兩個干擾項應來自易混淆組：%v", got)
		}
	}
	// 易混淆組不夠時補同類符號
	many := SymbolDistractors(c, "ㄅ", 10, rng(5))
	if len(many) != 10 {
		t.Fatalf("應補足 10 個：%v", many)
	}
	for _, d := range many {
		if zhuyin.Category(d) != zhuyin.CategoryInitial {
			t.Fatalf("聲母的干擾項應為聲母：%s", d)
		}
	}
}

func TestReproducible(t *testing.T) {
	a, _ := Build(c, BuildInput{Type: FillChar, Pokemon: c.Pokemon[25], Target: "char:卡", OptionCount: 4, Rand: rng(42)})
	b, _ := Build(c, BuildInput{Type: FillChar, Pokemon: c.Pokemon[25], Target: "char:卡", OptionCount: 4, Rand: rng(42)})
	ja, _ := json.Marshal(a)
	jb, _ := json.Marshal(b)
	if string(ja) != string(jb) {
		t.Fatal("同一個 seed 應產生同一題")
	}
}

func TestContains(t *testing.T) {
	p := c.Pokemon[25]
	for item, want := range map[content.ItemID]bool{"sym:ㄆ": true, "sym:ㄅ": false, "tone:3": true, "syl:ㄑㄧㄡ": true, "char:卡": true, "char:下": false} {
		if Contains(p, item) != want {
			t.Errorf("Contains(皮卡丘, %s) 應為 %v", item, want)
		}
	}
}
