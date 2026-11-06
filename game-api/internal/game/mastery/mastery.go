// Package mastery 實作 Leitner 盒子制的熟練度與間隔重複（research R2）。
package mastery

import (
	"math/rand/v2"
	"sort"
	"time"
)

const (
	MaxLevel      = 5
	FamiliarLevel = 3
	day           = 24 * time.Hour
)

// Entry 是某個小朋友對某個學習項目的熟練度。
// DueEncounter 與 DueAt 最多只有一個有值：短期複習以遭遇序號排程、長期複習以時間排程。
type Entry struct {
	Level        int
	DueEncounter *int
	DueAt        *time.Time
	LastSeenAt   time.Time
}

// 各等級第一次就答對之後的複習間隔
var dayIntervals = map[int]time.Duration{2: 1 * day, 3: 3 * day, 4: 7 * day, 5: 21 * day}

// Apply 依作答結果更新熟練度。encounterIndex 是這次遭遇的序號（0 起算）。
func Apply(e Entry, wrongCount, encounterIndex int, now time.Time) Entry {
	out := Entry{Level: e.Level, LastSeenAt: now}
	switch {
	case wrongCount <= 0:
		out.Level = min(MaxLevel, e.Level+1)
		if out.Level <= 1 {
			out.DueEncounter = ptr(encounterIndex + 3)
		} else {
			t := now.Add(dayIntervals[out.Level])
			out.DueAt = &t
		}
	case wrongCount == 1:
		out.DueEncounter = ptr(encounterIndex + 3)
	default:
		out.Level = max(0, e.Level-2)
		out.DueEncounter = ptr(encounterIndex + 2)
	}
	return out
}

// OptionCount 回傳選項數量：L0-1 兩個、L2-3 三個、L4-5 四個（FR-036）。
func OptionCount(level int) int {
	switch {
	case level >= 4:
		return 4
	case level >= 2:
		return 3
	default:
		return 2
	}
}

// IsFamiliar 回傳是否達到「熟悉」（level ≥ 3）。
func IsFamiliar(level int) bool { return level >= FamiliarLevel }

// IsDue 回傳這個項目現在是否該複習。
func IsDue(e Entry, encounterIndex int, now time.Time) bool {
	if e.DueEncounter != nil {
		return encounterIndex >= *e.DueEncounter
	}
	if e.DueAt != nil {
		return !now.Before(*e.DueAt)
	}
	return true
}

// PickTargets 依優先順序挑出 n 個要練的項目：
//  1. 到期的短期複習（剛答錯或剛學），依到期的遭遇序號、等級排序
//  2. 到期的長期複習，依等級、到期時間排序
//  3. 還沒學過的項目，依 candidates 的順序
//  4. 尚未到期的項目，依最快到期排序
func PickTargets[K comparable](m map[K]Entry, candidates []K, encounterIndex int, now time.Time, n int, r *rand.Rand) []K {
	type ranked struct {
		id    K
		group int
		a, b  int64
		tie   float64
	}
	list := make([]ranked, 0, len(candidates))
	seen := make(map[K]bool, len(candidates))
	for i, id := range candidates {
		if seen[id] {
			continue
		}
		seen[id] = true
		x := ranked{id: id, tie: r.Float64()}
		e, ok := m[id]
		switch {
		case !ok:
			x.group, x.a = 2, int64(i)
		case IsDue(e, encounterIndex, now) && e.DueEncounter != nil:
			x.group, x.a, x.b = 0, int64(*e.DueEncounter), int64(e.Level)
		case IsDue(e, encounterIndex, now):
			x.group, x.a, x.b = 1, int64(e.Level), dueUnix(e)
		default:
			x.group = 3
			if e.DueEncounter != nil {
				// 以「幾次遭遇後」換算成接近的時間尺度：短期項目一律排在長期項目前
				x.a, x.b = 0, int64(*e.DueEncounter)
			} else {
				x.a, x.b = 1, dueUnix(e)
			}
		}
		list = append(list, x)
	}
	sort.Slice(list, func(i, j int) bool {
		a, b := list[i], list[j]
		if a.group != b.group {
			return a.group < b.group
		}
		if a.a != b.a {
			return a.a < b.a
		}
		if a.b != b.b {
			return a.b < b.b
		}
		return a.tie < b.tie
	})
	out := make([]K, 0, n)
	for _, x := range list {
		if len(out) == n {
			break
		}
		out = append(out, x.id)
	}
	return out
}

func dueUnix(e Entry) int64 {
	if e.DueAt == nil {
		return 0
	}
	return e.DueAt.Unix()
}

func ptr(v int) *int { return &v }
