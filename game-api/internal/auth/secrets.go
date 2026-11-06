// Package auth 處理密碼、救援碼與 session token（research R6）。
package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/argon2"
)

// Params 是 argon2id 的參數，VPS 記憶體有限時可以調低 Memory。
type Params struct {
	Memory  uint32 // KiB
	Time    uint32
	Threads uint8
}

var DefaultParams = Params{Memory: 64 * 1024, Time: 1, Threads: 4}

// TestParams 讓測試跑得快。
var TestParams = Params{Memory: 1024, Time: 1, Threads: 1}

const (
	saltLen = 16
	keyLen  = 32
)

// Hash 產生 PHC 格式的 argon2id 雜湊字串。
func (p Params) Hash(secret string) (string, error) {
	salt := make([]byte, saltLen)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	key := argon2.IDKey([]byte(secret), salt, p.Time, p.Memory, p.Threads, keyLen)
	enc := base64.RawStdEncoding
	return fmt.Sprintf("$argon2id$v=%d$m=%d,t=%d,p=%d$%s$%s",
		argon2.Version, p.Memory, p.Time, p.Threads, enc.EncodeToString(salt), enc.EncodeToString(key)), nil
}

var ErrBadHash = errors.New("雜湊格式不正確")

// Verify 比對明文與雜湊（固定時間比較）。
func Verify(secret, encoded string) (bool, error) {
	parts := strings.Split(encoded, "$")
	if len(parts) != 6 || parts[1] != "argon2id" {
		return false, ErrBadHash
	}
	var version int
	var p Params
	if _, err := fmt.Sscanf(parts[2], "v=%d", &version); err != nil {
		return false, ErrBadHash
	}
	if _, err := fmt.Sscanf(parts[3], "m=%d,t=%d,p=%d", &p.Memory, &p.Time, &p.Threads); err != nil {
		return false, ErrBadHash
	}
	enc := base64.RawStdEncoding
	salt, err1 := enc.DecodeString(parts[4])
	want, err2 := enc.DecodeString(parts[5])
	if err1 != nil || err2 != nil {
		return false, ErrBadHash
	}
	got := argon2.IDKey([]byte(secret), salt, p.Time, p.Memory, p.Threads, uint32(len(want)))
	return subtle.ConstantTimeCompare(got, want) == 1, nil
}

// Crockford Base32（排除 I、L、O、U，避免看錯）
const crockford = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"

// NewRescueCode 產生 16 個字元的救援碼，顯示為 XXXX-XXXX-XXXX-XXXX。
func NewRescueCode() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	var sb strings.Builder
	for i, x := range b {
		if i > 0 && i%4 == 0 {
			sb.WriteByte('-')
		}
		sb.WriteByte(crockford[int(x)%len(crockford)])
	}
	return sb.String()
}

// NormalizeRescueCode 去掉連字號與空白並轉大寫，再把容易看錯的字母換成數字，讓比對不受輸入格式影響。
func NormalizeRescueCode(s string) string {
	s = strings.ToUpper(s)
	s = strings.NewReplacer("-", "", " ", "", "O", "0", "I", "1", "L", "1").Replace(s)
	return s
}

// NewTemporaryPassword 產生管理者重設密碼用的臨時密碼。
func NewTemporaryPassword() string {
	return strings.ReplaceAll(NewRescueCode(), "-", "")[:12]
}

// NewSessionToken 回傳給 cookie 的 token 與存進資料庫的 SHA-256。
func NewSessionToken() (token string, hash []byte) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		panic(err)
	}
	token = base64.RawURLEncoding.EncodeToString(b)
	return token, HashToken(token)
}

// HashToken 回傳 token 的 SHA-256。
func HashToken(token string) []byte {
	h := sha256.Sum256([]byte(token))
	return h[:]
}
