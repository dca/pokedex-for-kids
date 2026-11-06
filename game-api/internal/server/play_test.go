package server

import (
	"strings"
	"testing"

	"game-api/internal/api"
)

func TestHealthz(t *testing.T) {
	e := newEnv(t)
	e.device().expect(200, "GET", "/healthz", nil)
}

func TestGuestSession(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	r := d.expect(201, "POST", "/auth/guest", nil)
	cookie := r.Header.Get("Set-Cookie")
	for _, attr := range []string{"zi_session=", "Path=/api", "HttpOnly", "Secure", "SameSite=Lax"} {
		if !strings.Contains(cookie, attr) {
			t.Fatalf("cookie 缺少 %s：%s", attr, cookie)
		}
	}
	var me api.Me
	r.decode(t, &me)
	if !me.IsGuest || len(me.Children) != 1 || me.Children[0].Nickname != "小訓練家" || me.Children[0].StartStage != "learn" {
		t.Fatalf("%+v", me)
	}
	// 再呼叫一次回 200 和同一個帳號
	var again api.Me
	d.expect(200, "POST", "/auth/guest", nil).decode(t, &again)
	if again.AccountId != me.AccountId {
		t.Fatal("應回傳同一個訪客")
	}
	var got api.Me
	d.expect(200, "GET", "/me", nil).decode(t, &got)
	if !got.IsGuest {
		t.Fatal("GET /me 應為訪客")
	}
	// 另一台裝置沒有 session
	e.device().expect(401, "GET", "/me", nil)
}

func TestRequireJSON(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	req := d.do("POST", "/auth/guest", nil, "Content-Type", "text/plain")
	if req.Status != 415 {
		t.Fatalf("非 JSON 的寫入請求應回 415：%d", req.Status)
	}
}

func TestEncounterFlow(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	child := d.guest().Children[0].Id.String()

	// 還沒選夥伴不能遭遇
	if r := d.do("POST", "/children/"+child+"/encounters", map[string]string{"zone": "meadow", "kind": "wild"}); r.Status != 409 || r.errCode(t) != "partner_required" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}
	d.choosePartner(child, 7)
	d.expect(409, "POST", "/children/"+child+"/partner", map[string]int{"pokemonId": 1})

	// 未開放的區域
	if r := d.do("POST", "/children/"+child+"/encounters", map[string]string{"zone": "hill", "kind": "wild"}); r.Status != 403 || r.errCode(t) != "zone_locked" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}

	enc := d.encounter(child, "meadow", "wild", "X-Test-Pokemon", "25")
	if enc.PokemonId != 25 || len(enc.Questions) < 1 || len(enc.Questions) > 3 {
		t.Fatalf("%+v", enc)
	}
	id := enc.Id.String()
	// 有題目沒作答就結算
	if r := d.do("POST", "/encounters/"+id+"/complete", nil); r.Status != 409 || r.errCode(t) != "encounter_incomplete" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}
	d.answer(id, 0, 1)
	d.answer(id, 0, 1) // 重送相同內容
	if r := d.do("PUT", "/encounters/"+id+"/answers/0", map[string]int{"wrongCount": 0, "durationMs": 1}); r.Status != 409 {
		t.Fatalf("內容不同的重送應回 409：%d", r.Status)
	}
	for i := 1; i < len(enc.Questions); i++ {
		d.answer(id, i, 0)
	}
	res := d.complete(id)
	if res.Stars == nil || *res.Stars != 2 || !res.NewlyCaught || res.XpGained != len(enc.Questions) {
		t.Fatalf("答錯 1 次應得 2 顆星並收服：%+v", res)
	}
	again := d.complete(id)
	if *again.Stars != 2 || !again.NewlyCaught {
		t.Fatal("重送 complete 應回傳相同結果")
	}
	if len(res.State.Caught) != 1 || res.State.Caught[0].PokemonId != 25 || res.State.EncounterCount != 1 {
		t.Fatalf("%+v", res.State)
	}

	// 再收服一次，星星取最高
	_, r2 := d.play(child, "meadow", 0, "X-Test-Pokemon", "25")
	if *r2.Stars != 3 || r2.NewlyCaught {
		t.Fatalf("%+v", r2)
	}
	_, r3 := d.play(child, "meadow", 2, "X-Test-Pokemon", "25")
	if *r3.Stars != 1 || r3.State.Caught[0].BestStars != 3 {
		t.Fatalf("最佳星星應保留 3：%+v", r3.State.Caught)
	}

	// 其他裝置（另一個訪客）不能存取這個遭遇或小朋友
	other := e.device()
	other.guest()
	other.expect(404, "POST", "/encounters/"+id+"/complete", nil)
	other.expect(404, "GET", "/children/"+child+"/state", nil)
}

func TestValidation(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	child := d.guest().Children[0].Id.String()
	d.choosePartner(child, 4)
	enc := d.encounter(child, "meadow", "wild")
	if r := d.do("PUT", "/encounters/"+enc.Id.String()+"/answers/0", map[string]int{"wrongCount": 3, "durationMs": 1}); r.Status != 400 {
		t.Fatalf("wrongCount 3 應回 400：%d %s", r.Status, r.Body)
	}
	if r := d.do("POST", "/children/"+child+"/encounters", map[string]string{"zone": "moon", "kind": "wild"}); r.Status != 400 {
		t.Fatalf("不存在的區域應回 400：%d", r.Status)
	}
}

func TestQuestionsHaveAnswers(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	child := d.guest().Children[0].Id.String()
	d.choosePartner(child, 1)
	enc := d.encounter(child, "meadow", "wild")
	for _, q := range enc.Questions {
		if len(q.Answer) == 0 || len(q.Options) < 2 || q.PokemonId != enc.PokemonId {
			t.Fatalf("%+v", q)
		}
	}
}
