// Package progress 計算星星、連續答對、夥伴進化、區域開放與道館判定。
package progress

import (
	"game-api/internal/content"
	"game-api/internal/game/mastery"
)

const (
	FirstEvolutionXP  = 50
	SecondEvolutionXP = 150
	GymQuestions      = 10
	GymPassCount      = 8
	UnlockRatio       = 0.8
)

// Stars：沒有答錯 3 顆、答錯 1 次 2 顆、2 次以上 1 顆。
func Stars(totalWrong int) int {
	switch {
	case totalWrong <= 0:
		return 3
	case totalWrong == 1:
		return 2
	default:
		return 1
	}
}

// StreakAfter：第一次就答對時連續數 +1，否則歸零。
func StreakAfter(streak, wrongCount int) int {
	if wrongCount == 0 {
		return streak + 1
	}
	return 0
}

// GymPassed：10 題中第一次就答對至少 8 題。
func GymPassed(correctCount int) bool { return correctCount >= GymPassCount }

// 最終進化後依經驗值解鎖的稱號
var titles = []struct {
	xp    int
	title string
}{
	{600, "注音大師"},
	{300, "注音小達人"},
	{SecondEvolutionXP, "注音小幫手"},
}

type PartnerForm struct {
	CurrentID       int
	NextEvolutionXP *int
	Title           *string
}

// Partner 依經驗值計算夥伴目前的樣子。
func Partner(c *content.Content, baseID, xp int) PartnerForm {
	cur := baseID
	stages := 0
	for _, need := range []int{FirstEvolutionXP, SecondEvolutionXP} {
		next := c.Pokemon[cur].EvolvesTo
		if xp >= need && next != nil {
			cur = *next
			stages++
		}
	}
	f := PartnerForm{CurrentID: cur}
	if c.Pokemon[cur].EvolvesTo != nil {
		need := FirstEvolutionXP
		if stages >= 1 {
			need = SecondEvolutionXP
		}
		f.NextEvolutionXP = &need
		return f
	}
	for _, t := range titles {
		if xp >= t.xp {
			title := t.title
			f.Title = &title
			break
		}
	}
	return f
}

// StartZones 回傳起始階段直接開放的區域（research R7）。
func StartZones(stage content.Stage) int {
	switch stage {
	case content.StageRead:
		return 4
	case content.StageSpell:
		return 3
	default:
		return 1
	}
}

type ZoneProgress struct {
	Zone     content.ZoneID
	Familiar int
	Total    int
}

// Progress 回傳每區的熟悉項目數。
func Progress(c *content.Content, m map[content.ItemID]mastery.Entry) []ZoneProgress {
	out := make([]ZoneProgress, 0, len(c.Zones))
	for _, z := range c.Zones {
		p := ZoneProgress{Zone: z.ID, Total: len(z.Items)}
		for _, item := range z.Items {
			if e, ok := m[item]; ok && mastery.IsFamiliar(e.Level) {
				p.Familiar++
			}
		}
		out = append(out, p)
	}
	return out
}

// UnlockedZones：起始階段開放的區域，加上「前一區已開放且 ≥ 80% 熟悉」的區域（FR-017）。
func UnlockedZones(c *content.Content, start content.Stage, m map[content.ItemID]mastery.Entry) []content.ZoneID {
	progress := Progress(c, m)
	n := StartZones(start)
	for n < len(c.Zones) {
		prev := progress[n-1]
		if prev.Total == 0 || float64(prev.Familiar) < UnlockRatio*float64(prev.Total) {
			break
		}
		n++
	}
	out := make([]content.ZoneID, 0, n)
	for _, z := range c.Zones[:n] {
		out = append(out, z.ID)
	}
	return out
}
