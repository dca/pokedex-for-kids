package server

import (
	"slices"
	"testing"
	"time"

	"game-api/internal/api"
)

// US2：起始階段決定開放的區域；道館 10 題答對 8 題得到徽章。
func TestZonesAndGym(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	d.guest()
	var child api.Child
	d.expect(201, "POST", "/children", map[string]string{"nickname": "哥哥", "avatar": "avatar-02", "startStage": "read"}).decode(t, &child)
	id := child.Id.String()
	d.choosePartner(id, 4)

	st := d.state(id)
	if len(st.UnlockedZones) != 4 {
		t.Fatalf("認字起始應開放四區：%v", st.UnlockedZones)
	}
	for _, zone := range []string{"meadow", "beach", "forest", "hill"} {
		enc := d.encounter(id, zone, "wild")
		for _, q := range enc.Questions {
			switch zone {
			case "hill":
				if !slices.Contains([]api.QuestionType{"listen_name", "zhuyin_to_char", "fill_char"}, q.Type) {
					t.Fatalf("文字山丘出現 %s", q.Type)
				}
			case "forest":
				if !slices.Contains([]api.QuestionType{"fill_symbol", "fill_tone", "build_syllable"}, q.Type) {
					t.Fatalf("拼音森林出現 %s", q.Type)
				}
			}
		}
	}

	gym := d.encounter(id, "meadow", "gym")
	if len(gym.Questions) != 10 || gym.Kind != "gym" {
		t.Fatalf("道館應有 10 題：%d", len(gym.Questions))
	}
	// 3 題答錯 → 7/10 不通過
	for i := range gym.Questions {
		wrong := 0
		if i < 3 {
			wrong = 1
		}
		d.answer(gym.Id.String(), i, wrong)
	}
	res := d.complete(gym.Id.String())
	if res.Gym == nil || res.Gym.Passed || res.Gym.CorrectCount != 7 || res.Stars != nil || len(res.State.Badges) != 0 {
		t.Fatalf("7 題不應通過：%+v", res.Gym)
	}
	// 再挑戰：2 題答錯 → 8/10 通過
	gym2 := d.encounter(id, "meadow", "gym")
	for i := range gym2.Questions {
		wrong := 0
		if i < 2 {
			wrong = 2
		}
		d.answer(gym2.Id.String(), i, wrong)
	}
	res2 := d.complete(gym2.Id.String())
	if !res2.Gym.Passed || !res2.Gym.BadgeEarned || len(res2.State.Badges) != 1 || res2.State.Badges[0].Zone != "meadow" {
		t.Fatalf("8 題應通過並得到徽章：%+v", res2)
	}
	// 第三次通過不會再得到新徽章
	gym3 := d.encounter(id, "meadow", "gym")
	for i := range gym3.Questions {
		d.answer(gym3.Id.String(), i, 0)
	}
	if res3 := d.complete(gym3.Id.String()); !res3.Gym.Passed || res3.Gym.BadgeEarned {
		t.Fatalf("已有徽章時 badgeEarned 應為 false：%+v", res3.Gym)
	}
}

// US2 驗收 5：熟練度達標時開放下一區，結算結果會告知新開放的區域。
func TestZoneUnlockByMastery(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	id := d.guest().Children[0].Id.String()
	d.choosePartner(id, 1)

	unlockedAt := -1
	for i := 0; i < 200 && unlockedAt < 0; i++ {
		_, res := d.play(id, "meadow", 0)
		if slices.Contains(res.NewlyUnlockedZones, "beach") {
			unlockedAt = i
			if !slices.Contains(res.State.UnlockedZones, "beach") {
				t.Fatal("state 應包含泡泡海灘")
			}
		}
		e.now = e.now.Add(4 * 24 * time.Hour) // 讓長期複習到期
	}
	if unlockedAt < 0 {
		st := d.state(id)
		t.Fatalf("一直答對，200 次遭遇內應開放泡泡海灘：%+v %v", st.ZoneProgress, st.UnlockedZones)
	}
	_, after := d.play(id, "meadow", 0)
	if len(after.NewlyUnlockedZones) != 0 {
		t.Fatal("新開放的區域只應通知一次")
	}
	d.encounter(id, "beach", "wild")
}

// US3 驗收 1：答錯的項目在之後 5 次遭遇內會再出現。
func TestWrongItemReturns(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	id := d.guest().Children[0].Id.String()
	d.choosePartner(id, 7)

	// 先把草原的項目都練到 L1 以上（全部答對），讓「新項目」不會插隊
	for i := 0; i < 30; i++ {
		d.play(id, "meadow", 0)
	}
	// 找一題，答錯兩次
	enc := d.encounter(id, "meadow", "wild")
	target := enc.Questions[0].ItemIds[0]
	for i := range enc.Questions {
		wrong := 0
		if i == 0 {
			wrong = 2
		}
		d.answer(enc.Id.String(), i, wrong)
	}
	d.complete(enc.Id.String())

	found := false
	for k := 0; k < 5 && !found; k++ {
		next, _ := d.play(id, "meadow", 0)
		for _, q := range next.Questions {
			found = found || slices.Contains(q.ItemIds, target)
		}
	}
	if !found {
		t.Fatalf("%s 答錯後 5 次遭遇內沒有出現", target)
	}
}

// US4：夥伴經驗值 50 時進化；結算結果告知進化。
func TestPartnerEvolves(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	id := d.guest().Children[0].Id.String()
	d.choosePartner(id, 4)

	var evolved *api.EncounterResult
	for i := 0; i < 60 && evolved == nil; i++ {
		_, res := d.play(id, "meadow", 0)
		if res.Evolved != nil {
			evolved = &res
		}
	}
	if evolved == nil {
		t.Fatal("答對 50 題後應進化")
	}
	if evolved.Evolved.FromId != 4 || evolved.Evolved.ToId != 5 || evolved.State.Partner.CurrentId != 5 {
		t.Fatalf("%+v", evolved.Evolved)
	}
	if evolved.State.Partner.Xp < 50 || *evolved.State.Partner.NextEvolutionXp != 150 {
		t.Fatalf("%+v", evolved.State.Partner)
	}
}

// 兩台裝置同時玩同一個小朋友：作答都記錄、收服取聯集。
func TestTwoDevicesSameChild(t *testing.T) {
	e := newEnv(t)
	a := e.device()
	a.guest()
	a.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})
	id := a.state(childOf(t, a)).Child.Id.String()
	a.choosePartner(id, 1)

	b := e.device()
	b.expect(200, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})

	encA := a.encounter(id, "meadow", "wild", "X-Test-Pokemon", "16")
	encB := b.encounter(id, "meadow", "wild", "X-Test-Pokemon", "19")
	for i := range encA.Questions {
		a.answer(encA.Id.String(), i, 0)
	}
	for i := range encB.Questions {
		b.answer(encB.Id.String(), i, 1)
	}
	a.complete(encA.Id.String())
	b.complete(encB.Id.String())
	st := a.state(id)
	if len(st.Caught) != 2 || st.EncounterCount != 2 || st.Partner.Xp != len(encA.Questions)+len(encB.Questions) {
		t.Fatalf("%+v", st)
	}
}

func childOf(t *testing.T, c *client) string {
	t.Helper()
	var me api.Me
	c.expect(200, "GET", "/me", nil).decode(t, &me)
	return me.Children[0].Id.String()
}
