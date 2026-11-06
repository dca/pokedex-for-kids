package progress

import (
	"fmt"
	"testing"

	"game-api/internal/content"
	"game-api/internal/game/mastery"
)

var c = content.MustLoad()

func TestStars(t *testing.T) {
	for wrong, want := range map[int]int{0: 3, 1: 2, 2: 1, 5: 1} {
		if got := Stars(wrong); got != want {
			t.Errorf("Stars(%d) = %d；想要 %d", wrong, got, want)
		}
	}
}

func TestStreakAfter(t *testing.T) {
	if StreakAfter(3, 0) != 4 || StreakAfter(3, 1) != 0 || StreakAfter(0, 2) != 0 {
		t.Fatal("StreakAfter 錯誤")
	}
}

func TestGymPassed(t *testing.T) {
	if GymPassed(7) || !GymPassed(8) || !GymPassed(10) {
		t.Fatal("道館通過標準應為 8 題")
	}
}

func TestPartnerEvolution(t *testing.T) {
	cases := []struct {
		base, xp, want int
		next           *int
		title          string
	}{
		{1, 0, 1, ptr(50), ""},
		{1, 49, 1, ptr(50), ""},
		{1, 50, 2, ptr(150), ""},
		{1, 149, 2, ptr(150), ""},
		{1, 150, 3, nil, "注音小幫手"},
		{4, 300, 6, nil, "注音小達人"},
		{7, 600, 9, nil, "注音大師"},
	}
	for _, tc := range cases {
		f := Partner(c, tc.base, tc.xp)
		if f.CurrentID != tc.want {
			t.Errorf("Partner(%d, %d) = #%d；想要 #%d", tc.base, tc.xp, f.CurrentID, tc.want)
		}
		if fmt.Sprint(deref(f.NextEvolutionXP)) != fmt.Sprint(deref(tc.next)) {
			t.Errorf("Partner(%d, %d) next = %v；想要 %v", tc.base, tc.xp, deref(f.NextEvolutionXP), deref(tc.next))
		}
		got := ""
		if f.Title != nil {
			got = *f.Title
		}
		if got != tc.title {
			t.Errorf("Partner(%d, %d) title = %q；想要 %q", tc.base, tc.xp, got, tc.title)
		}
	}
}

func familiar(items []content.ItemID, n int) map[content.ItemID]mastery.Entry {
	m := map[content.ItemID]mastery.Entry{}
	for _, it := range items[:n] {
		m[it] = mastery.Entry{Level: 3}
	}
	return m
}

func TestUnlockedZones(t *testing.T) {
	meadow := c.Zones[0].Items // 21 項；80% 需要 17 項（16.8 無條件進位）
	if got := UnlockedZones(c, content.StageLearn, nil); fmt.Sprint(got) != "[meadow]" {
		t.Fatalf("新檔案：%v", got)
	}
	if got := UnlockedZones(c, content.StageLearn, familiar(meadow, 16)); len(got) != 1 {
		t.Fatalf("16/21（76%%）不應開放：%v", got)
	}
	if got := UnlockedZones(c, content.StageLearn, familiar(meadow, 17)); fmt.Sprint(got) != "[meadow beach]" {
		t.Fatalf("17/21（81%%）應開放泡泡海灘：%v", got)
	}
	if got := UnlockedZones(c, content.StageSpell, nil); len(got) != 3 {
		t.Fatalf("起始階段拼注音應有三區：%v", got)
	}
	if got := UnlockedZones(c, content.StageRead, nil); len(got) != 4 {
		t.Fatalf("起始階段認字應有四區：%v", got)
	}
}

func TestUnlockBoundaryExact(t *testing.T) {
	// 用 10 個項目的區域檢查 79% / 80% 的邊界
	zones := []content.Zone{
		{ID: content.Meadow, Order: 1, Items: items(10, "a")},
		{ID: content.Beach, Order: 2, Items: items(10, "b")},
		{ID: content.Forest, Order: 3},
		{ID: content.Hill, Order: 4},
	}
	small, err := content.Build(nil, zones, content.Confusables{})
	if err != nil {
		t.Fatal(err)
	}
	if got := UnlockedZones(small, content.StageLearn, familiar(zones[0].Items, 7)); len(got) != 1 {
		t.Fatalf("70%% 不應開放：%v", got)
	}
	if got := UnlockedZones(small, content.StageLearn, familiar(zones[0].Items, 8)); len(got) != 2 {
		t.Fatalf("80%% 應開放：%v", got)
	}
}

func items(n int, prefix string) []content.ItemID {
	out := make([]content.ItemID, n)
	for i := range out {
		out[i] = content.ItemID(fmt.Sprintf("sym:%s%d", prefix, i))
	}
	return out
}

func ptr(v int) *int { return &v }
func deref(p *int) any {
	if p == nil {
		return nil
	}
	return *p
}
