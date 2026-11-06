package mastery

import (
	"fmt"
	"math/rand/v2"
	"testing"
	"time"
)

var t0 = time.Date(2026, 11, 6, 9, 0, 0, 0, time.UTC)

func TestApplyTable(t *testing.T) {
	cases := []struct {
		name        string
		level       int
		wrong       int
		wantLevel   int
		wantDueEnc  *int
		wantDueDays int
	}{
		{"新項目第一次就答對", 0, 0, 1, ptr(10 + 3), 0},
		{"L1 答對升 L2，隔 1 天", 1, 0, 2, nil, 1},
		{"L2 答對升 L3，隔 3 天", 2, 0, 3, nil, 3},
		{"L3 答對升 L4，隔 7 天", 3, 0, 4, nil, 7},
		{"L4 答對升 L5，隔 21 天", 4, 0, 5, nil, 21},
		{"L5 答對維持 L5", 5, 0, 5, nil, 21},
		{"答錯一次後答對：等級不變，隔 3 次遭遇", 3, 1, 3, ptr(13), 0},
		{"答錯兩次：降兩級，隔 2 次遭遇", 3, 2, 1, ptr(12), 0},
		{"答錯兩次：最低 0", 1, 2, 0, ptr(12), 0},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := Apply(Entry{Level: c.level}, c.wrong, 10, t0)
			if got.Level != c.wantLevel {
				t.Fatalf("level = %d；想要 %d", got.Level, c.wantLevel)
			}
			if (got.DueEncounter == nil) != (c.wantDueEnc == nil) || (c.wantDueEnc != nil && *got.DueEncounter != *c.wantDueEnc) {
				t.Fatalf("dueEncounter = %v；想要 %v", got.DueEncounter, c.wantDueEnc)
			}
			if c.wantDueDays > 0 {
				if got.DueAt == nil || !got.DueAt.Equal(t0.Add(time.Duration(c.wantDueDays)*24*time.Hour)) {
					t.Fatalf("dueAt = %v；想要 %d 天後", got.DueAt, c.wantDueDays)
				}
			} else if got.DueAt != nil {
				t.Fatalf("不應以時間排程：%v", got.DueAt)
			}
			if !got.LastSeenAt.Equal(t0) {
				t.Fatal("lastSeenAt 錯誤")
			}
		})
	}
}

func TestIntervalsIncrease(t *testing.T) {
	e := Entry{}
	prev := time.Duration(-1)
	now := t0
	for i := 0; i < 5; i++ {
		e = Apply(e, 0, i*10, now)
		var interval time.Duration
		if e.DueAt != nil {
			interval = e.DueAt.Sub(now)
		} else {
			interval = time.Duration(*e.DueEncounter-i*10) * time.Minute // 短期排程換算成很短的間隔
		}
		if interval <= prev {
			t.Fatalf("第 %d 次答對的間隔 %v 沒有比上一次 %v 長", i+1, interval, prev)
		}
		prev = interval
	}
}

func TestOptionCount(t *testing.T) {
	want := []int{2, 2, 3, 3, 4, 4}
	for level, w := range want {
		if got := OptionCount(level); got != w {
			t.Errorf("OptionCount(%d) = %d；想要 %d", level, got, w)
		}
	}
	if IsFamiliar(2) || !IsFamiliar(3) {
		t.Error("IsFamiliar 邊界錯誤")
	}
}

func TestPickTargetsOrder(t *testing.T) {
	r := rand.New(rand.NewPCG(1, 2))
	past := t0.Add(-time.Hour)
	future := t0.Add(48 * time.Hour)
	m := map[string]Entry{
		"due-short": {Level: 0, DueEncounter: ptr(3)},
		"due-long":  {Level: 2, DueAt: &past},
		"later":     {Level: 4, DueAt: &future},
	}
	got := PickTargets(m, []string{"later", "new-a", "due-long", "new-b", "due-short"}, 5, t0, 5, r)
	want := []string{"due-short", "due-long", "new-a", "new-b", "later"}
	if fmt.Sprint(got) != fmt.Sprint(want) {
		t.Fatalf("got %v；想要 %v", got, want)
	}
}

// 性質測試：任意狀態下，答錯兩次的項目在之後 5 次遭遇內一定會被選到（US3 驗收 1）。
// 為了讓保證有意義，其他「短期待複習」的項目最多 2 個（每次遭遇至少練 1 題）。
func TestWrongItemReturnsWithinFiveEncounters(t *testing.T) {
	r := rand.New(rand.NewPCG(7, 7))
	for trial := 0; trial < 500; trial++ {
		items := make([]string, 30)
		for i := range items {
			items[i] = fmt.Sprintf("item-%02d", i)
		}
		m := map[string]Entry{}
		start := 20 + r.IntN(20)
		shortTerm := 0
		for _, id := range items {
			switch r.IntN(4) {
			case 0: // 沒學過
			case 1:
				if shortTerm < 2 {
					shortTerm++
					m[id] = Entry{Level: r.IntN(2), DueEncounter: ptr(start + r.IntN(4))}
				}
			default:
				d := t0.Add(time.Duration(r.IntN(96)-48) * time.Hour)
				m[id] = Entry{Level: 1 + r.IntN(5), DueAt: &d}
			}
		}
		target := items[r.IntN(len(items))]
		m[target] = Apply(m[target], 2, start, t0)

		found := false
		for k := 1; k <= 5 && !found; k++ {
			idx := start + k
			picked := PickTargets(m, items, idx, t0, 1, r)
			for _, id := range picked {
				if id == target {
					found = true
				}
				m[id] = Apply(m[id], 0, idx, t0) // 其他項目都答對
			}
		}
		if !found {
			t.Fatalf("第 %d 次測試：%s 在 5 次遭遇內沒有出現", trial, target)
		}
	}
}
