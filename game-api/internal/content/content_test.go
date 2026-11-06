package content

import (
	"testing"

	"game-api/internal/game/zhuyin"
)

func TestLoad(t *testing.T) {
	c := MustLoad()
	if len(c.PokemonList) != 151 {
		t.Fatalf("寶可夢數量 = %d", len(c.PokemonList))
	}
	if len(c.Zones) != 4 || c.Zones[0].ID != Meadow || c.Zones[3].ID != Hill {
		t.Fatalf("區域順序錯誤：%+v", c.Zones)
	}
	pika := c.Pokemon[25]
	if pika.Name != "皮卡丘" || !pika.Rare || pika.Syllables[0].Initial != "ㄆ" {
		t.Fatalf("皮卡丘資料錯誤：%+v", pika)
	}
	if *c.Pokemon[1].EvolvesTo != 2 || c.Pokemon[3].EvolvesTo != nil {
		t.Fatal("進化路線錯誤")
	}
	for _, z := range AllZones {
		if len(c.InZone(z)) == 0 {
			t.Errorf("%s 沒有寶可夢", z)
		}
	}
}

func TestRoundTrip(t *testing.T) {
	c := MustLoad()
	for _, p := range c.PokemonList {
		for _, s := range p.Syllables {
			if s.IsHan && zhuyin.Format(s.Parsed()) != s.Zhuyin {
				t.Errorf("#%d %s：%s", p.ID, s.Char, s.Zhuyin)
			}
		}
	}
}

func TestCharZhuyin(t *testing.T) {
	c := MustLoad()
	if got := c.CharZhuyin["卡"]; len(got) == 0 || got[0] != "ㄎㄚˇ" {
		t.Fatalf("卡 = %v", got)
	}
	if len(c.HanChars) < 100 {
		t.Fatalf("漢字數量太少：%d", len(c.HanChars))
	}
}
