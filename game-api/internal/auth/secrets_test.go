package auth

import (
	"bytes"
	"regexp"
	"strings"
	"testing"
)

func TestHashVerify(t *testing.T) {
	h, err := TestParams.Hash("correct horse")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.HasPrefix(h, "$argon2id$v=19$m=1024,t=1,p=1$") {
		t.Fatalf("格式：%s", h)
	}
	if ok, _ := Verify("correct horse", h); !ok {
		t.Fatal("正確的密碼應通過")
	}
	if ok, _ := Verify("wrong", h); ok {
		t.Fatal("錯誤的密碼不應通過")
	}
	h2, _ := TestParams.Hash("correct horse")
	if h == h2 {
		t.Fatal("每次雜湊的 salt 應不同")
	}
	if _, err := Verify("x", "not-a-hash"); err == nil {
		t.Fatal("格式錯誤應回傳錯誤")
	}
}

func TestRescueCode(t *testing.T) {
	code := NewRescueCode()
	if !regexp.MustCompile(`^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4}){3}$`).MatchString(code) {
		t.Fatalf("救援碼格式：%s", code)
	}
	if NewRescueCode() == code {
		t.Fatal("救援碼應隨機")
	}
	// 比對時忽略大小寫、連字號與空白
	for _, input := range []string{strings.ToLower(code), strings.ReplaceAll(code, "-", ""), " " + strings.ReplaceAll(code, "-", " ") + " "} {
		if NormalizeRescueCode(input) != NormalizeRescueCode(code) {
			t.Fatalf("%q 應與 %q 相同", input, code)
		}
	}
	if NormalizeRescueCode("o1il") != "0111" {
		t.Fatal("容易看錯的字母應轉成數字")
	}
}

func TestSessionToken(t *testing.T) {
	token, hash := NewSessionToken()
	if len(token) < 40 || len(hash) != 32 {
		t.Fatalf("token %d、hash %d", len(token), len(hash))
	}
	if !bytes.Equal(HashToken(token), hash) {
		t.Fatal("HashToken 應與產生時相同")
	}
	if bytes.Contains(hash, []byte(token)) {
		t.Fatal("資料庫只存雜湊")
	}
}
