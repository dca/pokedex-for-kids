// Package service 是交易層：讀取資料庫、呼叫 internal/game 的純規則、寫回結果。
package service

import (
	"context"
	"errors"
	"math/rand/v2"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"game-api/internal/api"
	"game-api/internal/apperr"
	"game-api/internal/auth"
	"game-api/internal/content"
	"game-api/internal/store"
)

const (
	SessionTTL      = 30 * 24 * time.Hour
	GuestSessionTTL = 365 * 24 * time.Hour
	MaxChildren     = 8
	MaxLoginFails   = 5
	LockDuration    = 15 * time.Minute
)

type Service struct {
	DB      *pgxpool.Pool
	Content *content.Content
	Hash    auth.Params
	Now     func() time.Time
	// NewRand 回傳每次出題用的亂數來源；測試時可以固定。
	NewRand func() *rand.Rand
}

func New(db *pgxpool.Pool, c *content.Content, hash auth.Params) *Service {
	return &Service{
		DB: db, Content: c, Hash: hash,
		Now:     time.Now,
		NewRand: func() *rand.Rand { return rand.New(rand.NewPCG(rand.Uint64(), rand.Uint64())) },
	}
}

func (s *Service) q() *store.Queries { return store.New(s.DB) }

// tx 在交易中執行 fn；fn 回傳錯誤時 rollback。
func (s *Service) tx(ctx context.Context, fn func(q *store.Queries) error) error {
	return pgx.BeginFunc(ctx, s.DB, func(tx pgx.Tx) error { return fn(store.New(tx)) })
}

// Session 是目前請求的登入狀態（沒有 session 時為 nil）。
type Session struct {
	TokenHash []byte
	ExpiresAt time.Time
	Account   store.Account
}

// Issued 是要寫進 cookie 的新 session。
type Issued struct {
	Token     string
	ExpiresAt time.Time
}

func (s *Service) issue(ctx context.Context, q *store.Queries, accountID uuid.UUID, guest bool) (*Issued, error) {
	ttl := SessionTTL
	if guest {
		ttl = GuestSessionTTL
	}
	token, hash := auth.NewSessionToken()
	exp := s.Now().Add(ttl)
	if err := q.CreateSession(ctx, store.CreateSessionParams{TokenHash: hash, AccountID: accountID, ExpiresAt: exp}); err != nil {
		return nil, err
	}
	return &Issued{Token: token, ExpiresAt: exp}, nil
}

// LoadSession 依 cookie 的 token 載入 session；需要延長時回傳新的到期時間。
func (s *Service) LoadSession(ctx context.Context, token string) (*Session, *time.Time, error) {
	row, err := s.q().GetSession(ctx, auth.HashToken(token))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil, nil
	}
	if err != nil {
		return nil, nil, err
	}
	sess := &Session{
		TokenHash: row.TokenHash, ExpiresAt: row.ExpiresAt,
		Account: store.Account{
			ID: row.ID, IsGuest: row.IsGuest, Username: row.Username, UsernameLower: row.UsernameLower,
			PasswordHash: row.PasswordHash, RescueCodeHash: row.RescueCodeHash, FailedLogins: row.FailedLogins,
			LockedUntil: row.LockedUntil, LastSeenAt: row.LastSeenAt, CreatedAt: row.CreatedAt, UpdatedAt: row.UpdatedAt,
		},
	}
	ttl := SessionTTL
	if sess.Account.IsGuest {
		ttl = GuestSessionTTL
	}
	// 剩餘時間少於「有效期 − 1 天」時才延長，避免每個請求都寫資料庫
	if sess.ExpiresAt.Sub(s.Now()) < ttl-24*time.Hour {
		exp := s.Now().Add(ttl)
		if err := s.q().ExtendSession(ctx, store.ExtendSessionParams{TokenHash: sess.TokenHash, ExpiresAt: exp}); err != nil {
			return nil, nil, err
		}
		if err := s.q().TouchAccount(ctx, sess.Account.ID); err != nil {
			return nil, nil, err
		}
		sess.ExpiresAt = exp
		return sess, &exp, nil
	}
	return sess, nil, nil
}

func requireSession(sess *Session) error {
	if sess == nil {
		return apperr.Unauthorized
	}
	return nil
}

func (s *Service) me(ctx context.Context, q *store.Queries, a store.Account) (api.Me, error) {
	children, err := q.ListChildren(ctx, a.ID)
	if err != nil {
		return api.Me{}, err
	}
	out := api.Me{AccountId: a.ID, IsGuest: a.IsGuest, Username: a.Username, Children: make([]api.Child, 0, len(children))}
	for _, c := range children {
		out.Children = append(out.Children, childDTO(c))
	}
	return out, nil
}

func childDTO(c store.Child) api.Child {
	return api.Child{Id: c.ID, Nickname: c.Nickname, Avatar: c.Avatar, StartStage: api.Stage(c.StartStage), CreatedAt: c.CreatedAt}
}

func notFound(err error) error {
	if errors.Is(err, pgx.ErrNoRows) {
		return apperr.NotFound
	}
	return err
}

// Cleanup 刪除過期的 session、超過 24 小時未完成的遭遇，以及 180 天沒有使用的訪客帳號。
func (s *Service) Cleanup(ctx context.Context) (int64, error) {
	q := s.q()
	a, err := q.DeleteExpiredSessions(ctx)
	if err != nil {
		return 0, err
	}
	b, err := q.DeleteStaleEncounters(ctx, s.Now().Add(-24*time.Hour))
	if err != nil {
		return 0, err
	}
	c, err := q.DeleteStaleGuests(ctx, s.Now().Add(-180*24*time.Hour))
	return a + b + c, err
}
