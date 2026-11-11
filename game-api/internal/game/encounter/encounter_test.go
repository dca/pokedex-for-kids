package encounter

import (
	"math/rand/v2"
	"testing"
	"time"

	"game-api/internal/content"
	"game-api/internal/game/mastery"
	"game-api/internal/game/questions"
)

var (
	c  = content.MustLoad()
	t0 = time.Date(2026, 11, 6, 9, 0, 0, 0, time.UTC)
)

func rng(seed uint64) *rand.Rand { return rand.New(rand.NewPCG(seed, 5)) }

func TestRareWeight(t *testing.T) {
	for streak, want := range map[int]float64{0: 0.1, 1: 0.2, 4: 0.5, 5: 0.6, 20: 0.6} {
		if got := RareWeight(streak); got < want-1e-9 || got > want+1e-9 {
			t.Errorf("RareWeight(%d) = %v；想要 %v", streak, got, want)
		}
	}
}

func TestPickPokemonMatchesTarget(t *testing.T) {
	for seed := uint64(0); seed < 200; seed++ {
		p := PickPokemon(c, content.Meadow, "sym:ㄆ", nil, 0, rng(seed))
		if p.Zone != content.Meadow || !questions.Contains(p, "sym:ㄆ") {
			t.Fatalf("挑到 #%d %s", p.ID, p.Name)
		}
	}
	// 沒有任何名稱含 ㄖ 時，退回整區隨機
	p := PickPokemon(c, content.Meadow, "sym:ㄖ", nil, 0, rng(1))
	if p.Zone != content.Meadow {
		t.Fatal("退回時仍應在同一區")
	}
}

func TestUncaughtPreferred(t *testing.T) {
	target := content.ItemID("sym:ㄇ")
	var cands []int
	for _, p := range c.InZone(content.Meadow) {
		if questions.Contains(p, target) && !p.Rare {
			cands = append(cands, p.ID)
		}
	}
	if len(cands) < 2 {
		t.Skip("候選太少")
	}
	caught := map[int]int{}
	for _, id := range cands[1:] {
		caught[id] = 3
	}
	hits := 0
	const trials = 4000
	for i := 0; i < trials; i++ {
		if PickPokemon(c, content.Meadow, target, caught, 0, rng(uint64(i))).ID == cands[0] {
			hits++
		}
	}
	// 未收服的權重 ×2，期望比例約 2/(n+1)
	expected := 2.0 / float64(len(cands)+1)
	if got := float64(hits) / trials; got < expected*0.8 || got > expected*1.2 {
		t.Fatalf("未收服被抽中的比例 %.3f，期望約 %.3f", got, expected)
	}
}

func TestPlanWild(t *testing.T) {
	s := Snapshot{Mastery: map[content.ItemID]mastery.Entry{}, Caught: map[int]int{}, Now: t0}
	for _, zone := range content.AllZones {
		for seed := uint64(0); seed < 30; seed++ {
			plan, err := PlanWild(c, s, zone, rng(seed))
			if err != nil {
				t.Fatalf("%s：%v", zone, err)
			}
			z, _ := c.Zone(zone)
			if c.Pokemon[plan.PokemonID].Zone != zone {
				t.Fatalf("%s 挑到其他區的寶可夢", zone)
			}
			if n := len(plan.Questions); n < 1 || n > 3 {
				t.Fatalf("題數 %d", n)
			}
			for _, q := range plan.Questions {
				allowed := false
				for _, typ := range z.QuestionTypes {
					allowed = allowed || typ == q.Type
				}
				if !allowed {
					t.Fatalf("%s 出現不屬於本區的題型 %s", zone, q.Type)
				}
				if q.PokemonID != plan.PokemonID {
					t.Fatal("野生遭遇的題目應使用同一隻寶可夢")
				}
				if len(q.Options) != 2 && q.Type != questions.BuildSyllable {
					t.Fatalf("新項目應只有 2 個選項，實際 %d", len(q.Options))
				}
			}
		}
	}
}

func TestPlanWildTargetsWeakItem(t *testing.T) {
	m := map[content.ItemID]mastery.Entry{}
	for _, item := range c.Zones[0].Items {
		d := t0.Add(48 * time.Hour)
		m[item] = mastery.Entry{Level: 4, DueAt: &d}
	}
	m["sym:ㄆ"] = mastery.Apply(m["sym:ㄆ"], 2, 10, t0)
	plan, err := PlanWild(c, Snapshot{Mastery: m, EncounterIndex: 12, Now: t0}, content.Meadow, rng(1))
	if err != nil {
		t.Fatal(err)
	}
	if plan.Questions[0].ItemIDs[0] != "sym:ㄆ" {
		t.Fatalf("第一題應練 ㄆ：%v", plan.Questions[0].ItemIDs)
	}
	if !questions.Contains(c.Pokemon[plan.PokemonID], "sym:ㄆ") {
		t.Fatalf("應挑名稱含 ㄆ 的寶可夢：%s", c.Pokemon[plan.PokemonID].Name)
	}
}

func TestOptionCountGrowsWithMastery(t *testing.T) {
	m := map[content.ItemID]mastery.Entry{}
	for _, item := range c.Zones[0].Items {
		m[item] = mastery.Entry{Level: 5, DueEncounter: ptr(0)}
	}
	plan, _ := PlanWild(c, Snapshot{Mastery: m, EncounterIndex: 1, Now: t0}, content.Meadow, rng(2))
	if got := len(plan.Questions[0].Options); got != 4 {
		t.Fatalf("熟練項目應有 4 個選項：%d", got)
	}
}

func TestForestTiers(t *testing.T) {
	z, _ := c.Zone(content.Forest)
	first := Candidates(c, z, nil)
	if len(first) >= len(z.Items) {
		t.Fatal("一開始不應包含三拼")
	}
	m := map[content.ItemID]mastery.Entry{}
	for _, item := range first {
		m[item] = mastery.Entry{Level: 3}
	}
	if got := Candidates(c, z, m); len(got) != len(z.Items) {
		t.Fatalf("二拼熟悉後應加入三拼：%d / %d", len(got), len(z.Items))
	}
}

func TestPlanGym(t *testing.T) {
	for _, zone := range content.AllZones {
		plan, err := PlanGym(c, Snapshot{Now: t0}, zone, rng(3))
		if err != nil {
			t.Fatalf("%s：%v", zone, err)
		}
		if len(plan.Questions) != 10 {
			t.Fatalf("%s 道館題數 %d", zone, len(plan.Questions))
		}
		seen := map[string]bool{}
		for _, q := range plan.Questions {
			if seen[q.ItemIDs[0]] {
				t.Fatalf("%s 道館項目重複：%s", zone, q.ItemIDs[0])
			}
			seen[q.ItemIDs[0]] = true
		}
	}
}

func ptr(v int) *int { return &v }
