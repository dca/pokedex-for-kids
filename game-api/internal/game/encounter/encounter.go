// Package encounter 決定下一次遭遇的寶可夢與題目（FR-035、FR-043、research R3）。
package encounter

import (
	"errors"
	"math/rand/v2"
	"time"

	"game-api/internal/content"
	"game-api/internal/game/mastery"
	"game-api/internal/game/progress"
	"game-api/internal/game/questions"
	"game-api/internal/game/zhuyin"
)

// Snapshot 是出題需要的小朋友狀態。
type Snapshot struct {
	Mastery        map[content.ItemID]mastery.Entry
	Caught         map[int]int // 寶可夢 → 最佳星星
	CorrectStreak  int
	EncounterIndex int
	Now            time.Time
	// ForcePokemon 只在測試掛勾開啟時使用：指定這次遭遇的寶可夢
	ForcePokemon int
}

type Plan struct {
	PokemonID int
	Questions []questions.Question
}

// 每區道館的館主寶可夢（只用於顯示）
var GymLeaders = map[content.ZoneID]int{content.Meadow: 143, content.Beach: 131, content.Forest: 150, content.Hill: 149}

// RareWeight：稀有寶可夢的權重，連續答對每多 1 題 +0.1，上限 0.6。
func RareWeight(streak int) float64 {
	w := 0.1 + 0.1*float64(streak)
	if w > 0.6 {
		return 0.6
	}
	return w
}

// QuestionsPerEncounter：學注音、拼注音 1～2 題，認字 1～3 題，讓每次遭遇維持在 60 秒內。
func QuestionsPerEncounter(stage content.Stage, r *rand.Rand) int {
	if stage == content.StageRead {
		return 1 + r.IntN(3)
	}
	return 1 + r.IntN(2)
}

// PickPokemon 在區域內挑一隻名稱能練到 target 的寶可夢；沒有候選時從整區挑。
// 未收服的權重 ×2；稀有寶可夢的基礎權重依連續答對數調整。
func PickPokemon(c *content.Content, zone content.ZoneID, target content.ItemID, caught map[int]int, streak int, r *rand.Rand) content.Pokemon {
	all := c.InZone(zone)
	var candidates []content.Pokemon
	for _, p := range all {
		if questions.Contains(p, target) {
			candidates = append(candidates, p)
		}
	}
	if len(candidates) == 0 {
		candidates = all
	}
	weights := make([]float64, len(candidates))
	total := 0.0
	for i, p := range candidates {
		w := 1.0
		if p.Rare {
			w = RareWeight(streak)
		}
		if _, ok := caught[p.ID]; !ok {
			w *= 2
		}
		weights[i] = w
		total += w
	}
	x := r.Float64() * total
	for i, w := range weights {
		if x < w {
			return candidates[i]
		}
		x -= w
	}
	return candidates[len(candidates)-1]
}

// Candidates 回傳區域目前可以練的項目。拼音森林依二拼 → 三拼的順序開放（FR-012）：
// 一拼、二拼的音節有 60% 熟悉之後，才加入三拼。
func Candidates(c *content.Content, zone content.Zone, m map[content.ItemID]mastery.Entry) []content.ItemID {
	if zone.ID != content.Forest {
		return zone.Items
	}
	var small, large []content.ItemID
	familiar := 0
	for _, item := range zone.Items {
		s := zhuyin.MustParse(questions.ParseItem(item).Value)
		if zhuyin.Size(s) <= 2 {
			small = append(small, item)
			if e, ok := m[item]; ok && mastery.IsFamiliar(e.Level) {
				familiar++
			}
		} else {
			large = append(large, item)
		}
	}
	if len(small) == 0 || float64(familiar) >= 0.6*float64(len(small)) {
		return append(small, large...)
	}
	return small
}

var ErrNoQuestion = errors.New("無法產生題目")

func optionCount(m map[content.ItemID]mastery.Entry, item content.ItemID) int {
	return mastery.OptionCount(m[item].Level)
}

// question 為 target 挑一種可出的題型（目前區域允許的）並產生題目。
func question(c *content.Content, zone content.Zone, p content.Pokemon, target content.ItemID, s Snapshot, r *rand.Rand) (questions.Question, error) {
	types := questions.TypesFor(target, p, zone.QuestionTypes)
	if len(types) == 0 {
		return questions.Question{}, questions.ErrNotApplicable
	}
	return questions.Build(c, questions.BuildInput{
		Type: types[r.IntN(len(types))], Pokemon: p, Target: target,
		OptionCount: optionCount(s.Mastery, target), Rand: r,
	})
}

// PlanWild 安排一次野生遭遇：依熟練度挑出最該練的項目，再挑能練到它的寶可夢，出 1～3 題。
func PlanWild(c *content.Content, s Snapshot, zoneID content.ZoneID, r *rand.Rand) (Plan, error) {
	zone, ok := c.Zone(zoneID)
	if !ok {
		return Plan{}, ErrNoQuestion
	}
	cands := Candidates(c, zone, s.Mastery)
	n := QuestionsPerEncounter(zone.Stage, r)
	ranked := mastery.PickTargets(s.Mastery, cands, s.EncounterIndex, s.Now, len(cands), r)
	if len(ranked) == 0 {
		return Plan{}, ErrNoQuestion
	}
	p := PickPokemon(c, zoneID, ranked[0], s.Caught, s.CorrectStreak, r)
	if forced, ok := c.Pokemon[s.ForcePokemon]; ok {
		p = forced
	}

	var qs []questions.Question
	for _, target := range ranked {
		if len(qs) == n {
			break
		}
		q, err := question(c, zone, p, target, s, r)
		if err != nil {
			continue
		}
		qs = append(qs, q)
	}
	if len(qs) == 0 {
		return Plan{}, ErrNoQuestion
	}
	return Plan{PokemonID: p.ID, Questions: qs}, nil
}

// PlanGym 安排道館挑戰：從本區練習項目均勻抽 10 個不同的項目，每題搭配能練到它的寶可夢（FR-008）。
func PlanGym(c *content.Content, s Snapshot, zoneID content.ZoneID, r *rand.Rand) (Plan, error) {
	zone, ok := c.Zone(zoneID)
	if !ok {
		return Plan{}, ErrNoQuestion
	}
	items := append([]content.ItemID(nil), Candidates(c, zone, s.Mastery)...)
	r.Shuffle(len(items), func(i, j int) { items[i], items[j] = items[j], items[i] })
	var qs []questions.Question
	for _, target := range items {
		if len(qs) == progress.GymQuestions {
			break
		}
		p := PickPokemon(c, zoneID, target, s.Caught, 0, r)
		q, err := question(c, zone, p, target, s, r)
		if err != nil {
			continue
		}
		qs = append(qs, q)
	}
	if len(qs) < progress.GymQuestions {
		return Plan{}, ErrNoQuestion
	}
	return Plan{PokemonID: GymLeaders[zoneID], Questions: qs}, nil
}
