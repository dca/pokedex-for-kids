package server

import (
	"strconv"
	"strings"
	"testing"
	"time"

	"game-api/internal/api"
)

func TestRegisterUpgradesGuest(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	guest := d.guest()
	id := guest.Children[0].Id.String()
	d.choosePartner(id, 7)
	d.play(id, "meadow", 0, "X-Test-Pokemon", "25")

	r := d.expect(201, "POST", "/auth/register", map[string]string{"username": "Family_01", "password": "password123"})
	if !strings.Contains(r.Header.Get("Set-Cookie"), "zi_session=") {
		t.Fatal("註冊後應換新的 session")
	}
	var out api.RegisterResult
	r.decode(t, &out)
	if out.Me.IsGuest || out.Me.AccountId != guest.AccountId || *out.Me.Username != "Family_01" || len(out.Me.Children) != 1 {
		t.Fatalf("訪客應升級為正式帳號：%+v", out.Me)
	}
	if len(out.RescueCode) != 19 {
		t.Fatalf("救援碼：%q", out.RescueCode)
	}
	if st := d.state(id); len(st.Caught) != 1 {
		t.Fatal("訪客進度應保留")
	}
	// 已是正式帳號再註冊
	if r := d.do("POST", "/auth/register", map[string]string{"username": "another", "password": "password123"}); r.Status != 409 || r.errCode(t) != "already_registered" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}
	// 帳號名稱不分大小寫
	other := e.device()
	if r := other.do("POST", "/auth/register", map[string]string{"username": "family_01", "password": "password123"}); r.Status != 409 || r.errCode(t) != "username_taken" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}
	// 沒有 session 時直接建立新帳號（沒有小朋友）
	var fresh api.RegisterResult
	other.expect(201, "POST", "/auth/register", map[string]string{"username": "newfamily", "password": "password123"}).decode(t, &fresh)
	if fresh.Me.IsGuest || len(fresh.Me.Children) != 0 {
		t.Fatalf("%+v", fresh.Me)
	}
	// 格式驗證
	if r := e.device().do("POST", "/auth/register", map[string]string{"username": "ab", "password": "password123"}); r.Status != 400 {
		t.Fatalf("太短的帳號名稱應回 400：%d", r.Status)
	}
	if r := e.device().do("POST", "/auth/register", map[string]string{"username": "abc", "password": "short"}); r.Status != 400 {
		t.Fatalf("太短的密碼應回 400：%d", r.Status)
	}
}

func TestLoginAndLock(t *testing.T) {
	e := newEnv(t)
	e.device().expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})

	d := e.device()
	if r := d.do("POST", "/auth/login", map[string]string{"username": "family", "password": "wrong-pass"}); r.Status != 401 || r.errCode(t) != "invalid_credentials" {
		t.Fatalf("%d %s", r.Status, r.Body)
	}
	if r := d.do("POST", "/auth/login", map[string]string{"username": "nobody", "password": "wrong-pass"}); r.Status != 401 || r.errCode(t) != "invalid_credentials" {
		t.Fatal("不存在的帳號與錯誤密碼應回同樣的錯誤")
	}
	// 成功登入後歸零
	d.expect(200, "POST", "/auth/login", map[string]string{"username": "FAMILY", "password": "password123"})
	for i := 0; i < 4; i++ {
		d.expect(401, "POST", "/auth/login", map[string]string{"username": "family", "password": "wrong-pass"})
	}
	d.expect(200, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})
	// 連續 5 次失敗 → 鎖定，即使密碼正確也回 429
	for i := 0; i < 5; i++ {
		d.expect(401, "POST", "/auth/login", map[string]string{"username": "family", "password": "wrong-pass"})
	}
	r := d.expect(429, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})
	if s, _ := strconv.Atoi(r.Header.Get("Retry-After")); s <= 0 || s > 900 {
		t.Fatalf("Retry-After：%q", r.Header.Get("Retry-After"))
	}
	// 15 分鐘後解鎖
	e.now = e.now.Add(16 * time.Minute)
	d.expect(200, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})
}

func TestLoginBringsGuestChildren(t *testing.T) {
	e := newEnv(t)
	owner := e.device()
	owner.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})

	g := e.device()
	guest := g.guest()
	gid := guest.Children[0].Id.String()
	g.choosePartner(gid, 1)
	g.play(gid, "meadow", 0, "X-Test-Pokemon", "16")

	var me api.Me
	g.expect(200, "POST", "/auth/login", map[string]any{"username": "family", "password": "password123", "bringGuestChildren": true}).decode(t, &me)
	if me.IsGuest || len(me.Children) != 1 || me.Children[0].Id != guest.Children[0].Id {
		t.Fatalf("訪客的小朋友應帶進帳號：%+v", me)
	}
	if st := owner.state(gid); len(st.Caught) != 1 {
		t.Fatal("原本的裝置也應看到帶進來的進度")
	}

	// 放棄訪客進度
	g2 := e.device()
	g2.guest()
	var me2 api.Me
	g2.expect(200, "POST", "/auth/login", map[string]any{"username": "family", "password": "password123"}).decode(t, &me2)
	if len(me2.Children) != 1 {
		t.Fatalf("不帶入時不應多出檔案：%d", len(me2.Children))
	}
}

func TestBringGuestRespectsLimit(t *testing.T) {
	e := newEnv(t)
	owner := e.device()
	owner.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})
	for i := 0; i < 8; i++ {
		owner.expect(201, "POST", "/children", map[string]string{"nickname": "孩子", "avatar": "avatar-03", "startStage": "learn"})
	}
	owner.expect(422, "POST", "/children", map[string]string{"nickname": "第九個", "avatar": "avatar-03", "startStage": "learn"})
	g := e.device()
	g.guest()
	if r := g.do("POST", "/auth/login", map[string]any{"username": "family", "password": "password123", "bringGuestChildren": true}); r.Status != 422 {
		t.Fatalf("超過上限應回 422：%d", r.Status)
	}
}

func TestResetPasswordWithRescueCode(t *testing.T) {
	e := newEnv(t)
	a := e.device()
	var reg api.RegisterResult
	a.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"}).decode(t, &reg)

	b := e.device()
	if r := b.do("POST", "/auth/reset-password", map[string]string{"username": "family", "rescueCode": "0000-0000-0000-0000", "newPassword": "newpassword1"}); r.Status != 401 {
		t.Fatalf("錯誤的救援碼應回 401：%d", r.Status)
	}
	var out api.RegisterResult
	b.expect(200, "POST", "/auth/reset-password", map[string]string{
		"username": "family", "rescueCode": strings.ToLower(strings.ReplaceAll(reg.RescueCode, "-", "")), "newPassword": "newpassword1",
	}).decode(t, &out)
	if out.RescueCode == reg.RescueCode {
		t.Fatal("應產生新的救援碼")
	}
	// 舊救援碼失效、舊 session 失效
	b.expect(401, "POST", "/auth/reset-password", map[string]string{"username": "family", "rescueCode": reg.RescueCode, "newPassword": "newpassword2"})
	a.expect(401, "GET", "/me", nil)
	b.expect(200, "GET", "/me", nil)
	e.device().expect(200, "POST", "/auth/login", map[string]string{"username": "family", "password": "newpassword1"})
}

// FR-052：管理者在伺服器端重設密碼。
func TestAdminResetPassword(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	d.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})
	temp, rescue, err := e.svc.AdminResetPassword(t.Context(), "FAMILY")
	if err != nil {
		t.Fatal(err)
	}
	if len(temp) != 12 || len(rescue) != 19 {
		t.Fatalf("臨時密碼 %q、救援碼 %q", temp, rescue)
	}
	d.expect(401, "GET", "/me", nil)
	e.device().expect(401, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})
	e.device().expect(200, "POST", "/auth/login", map[string]string{"username": "family", "password": temp})
	e.device().expect(200, "POST", "/auth/reset-password", map[string]string{"username": "family", "rescueCode": rescue, "newPassword": "brandnew123"})
	if _, _, err := e.svc.AdminResetPassword(t.Context(), "nobody"); err == nil {
		t.Fatal("不存在的帳號應回傳錯誤")
	}
}

func TestLogout(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	d.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})
	d.expect(204, "POST", "/auth/logout", nil)
	d.expect(401, "GET", "/me", nil)
}

func TestChildrenAndDelete(t *testing.T) {
	e := newEnv(t)
	d := e.device()
	g := d.guest()
	gid := g.Children[0].Id.String()
	// 訪客不能刪除
	if r := d.do("DELETE", "/children/"+gid, map[string]string{"password": "x"}); r.Status != 403 {
		t.Fatalf("訪客刪除應回 403：%d", r.Status)
	}
	d.expect(201, "POST", "/auth/register", map[string]string{"username": "family", "password": "password123"})

	var c api.Child
	d.expect(201, "POST", "/children", map[string]string{"nickname": "妹妹", "avatar": "avatar-05", "startStage": "spell"}).decode(t, &c)
	cid := c.Id.String()
	var updated api.Child
	d.expect(200, "PATCH", "/children/"+cid, map[string]string{"nickname": "小妹"}).decode(t, &updated)
	if updated.Nickname != "小妹" || updated.Avatar != "avatar-05" {
		t.Fatalf("%+v", updated)
	}
	if st := d.state(cid); len(st.UnlockedZones) != 3 {
		t.Fatalf("拼注音起始應開放三區：%v", st.UnlockedZones)
	}
	d.expect(400, "POST", "/children", map[string]string{"nickname": "x", "avatar": "avatar-99", "startStage": "learn"})

	d.expect(403, "DELETE", "/children/"+cid, map[string]string{"password": "wrong"})
	d.expect(204, "DELETE", "/children/"+cid, map[string]string{"password": "password123"})
	d.expect(404, "GET", "/children/"+cid+"/state", nil)

	d.expect(403, "DELETE", "/me", map[string]string{"password": "wrong"})
	d.expect(204, "DELETE", "/me", map[string]string{"password": "password123"})
	d.expect(401, "GET", "/me", nil)
	e.device().expect(401, "POST", "/auth/login", map[string]string{"username": "family", "password": "password123"})
}
