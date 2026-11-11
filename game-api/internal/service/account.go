package service

import (
	"context"
	"errors"
	"math"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"game-api/internal/api"
	"game-api/internal/apperr"
	"game-api/internal/auth"
	"game-api/internal/game/progress"
	"game-api/internal/content"
	"game-api/internal/store"
)

const (
	DefaultNickname = "小訓練家"
	DefaultAvatar   = "avatar-01"
)

// StartGuest 建立訪客帳號與一個預設小朋友檔案；已有 session 時直接回傳。
func (s *Service) StartGuest(ctx context.Context, sess *Session) (api.Me, *Issued, bool, error) {
	if sess != nil {
		me, err := s.me(ctx, s.q(), sess.Account)
		return me, nil, false, err
	}
	var me api.Me
	var issued *Issued
	err := s.tx(ctx, func(q *store.Queries) error {
		a, err := q.CreateGuest(ctx, uuid.New())
		if err != nil {
			return err
		}
		if _, err := s.createChild(ctx, q, a.ID, DefaultNickname, DefaultAvatar, content.StageLearn); err != nil {
			return err
		}
		if issued, err = s.issue(ctx, q, a.ID, true); err != nil {
			return err
		}
		me, err = s.me(ctx, q, a)
		return err
	})
	return me, issued, true, err
}

func (s *Service) newCredentials(password string) (pwHash, rescueCode, rescueHash string, err error) {
	if pwHash, err = s.Hash.Hash(password); err != nil {
		return
	}
	rescueCode = auth.NewRescueCode()
	rescueHash, err = s.Hash.Hash(auth.NormalizeRescueCode(rescueCode))
	return
}

// Register 註冊正式帳號。目前是訪客時，直接把訪客升級，進度不動。
func (s *Service) Register(ctx context.Context, sess *Session, username, password string) (api.RegisterResult, *Issued, error) {
	if sess != nil && !sess.Account.IsGuest {
		return api.RegisterResult{}, nil, apperr.AlreadyRegistered
	}
	lower := strings.ToLower(username)
	pwHash, rescue, rescueHash, err := s.newCredentials(password)
	if err != nil {
		return api.RegisterResult{}, nil, err
	}
	var out api.RegisterResult
	var issued *Issued
	err = s.tx(ctx, func(q *store.Queries) error {
		taken, err := q.UsernameTaken(ctx, &lower)
		if err != nil {
			return err
		}
		if taken {
			return apperr.UsernameTaken
		}
		var a store.Account
		if sess != nil {
			a, err = q.UpgradeGuest(ctx, store.UpgradeGuestParams{ID: sess.Account.ID, Username: &username, UsernameLower: &lower, PasswordHash: &pwHash, RescueCodeHash: &rescueHash})
			if err != nil {
				return err
			}
			// 升級後換一個新的 session（有效期改為正式帳號的 30 天）
			if err := q.DeleteSession(ctx, sess.TokenHash); err != nil {
				return err
			}
		} else {
			a, err = q.CreateAccount(ctx, store.CreateAccountParams{ID: uuid.New(), Username: &username, UsernameLower: &lower, PasswordHash: &pwHash, RescueCodeHash: &rescueHash})
			if err != nil {
				return err
			}
		}
		if issued, err = s.issue(ctx, q, a.ID, false); err != nil {
			return err
		}
		me, err := s.me(ctx, q, a)
		out = api.RegisterResult{Me: me, RescueCode: rescue}
		return err
	})
	if isUniqueViolation(err) {
		return api.RegisterResult{}, nil, apperr.UsernameTaken
	}
	return out, issued, err
}

// checkLock 回傳鎖定中的錯誤（附剩餘秒數）。
func (s *Service) checkLock(a store.Account) error {
	if a.LockedUntil != nil && a.LockedUntil.After(s.Now()) {
		return apperr.Locked(int(math.Ceil(a.LockedUntil.Sub(s.Now()).Seconds())))
	}
	return nil
}

// recordFailure 累計失敗次數，連續 5 次就鎖定 15 分鐘。
func (s *Service) recordFailure(ctx context.Context, a store.Account) error {
	fails := a.FailedLogins + 1
	if a.LockedUntil != nil && !a.LockedUntil.After(s.Now()) {
		fails = 1 // 上一次鎖定已過期，重新計算
	}
	params := store.SetLoginFailuresParams{ID: a.ID, FailedLogins: fails}
	if fails >= MaxLoginFails {
		until := s.Now().Add(LockDuration)
		params.LockedUntil = &until
		params.FailedLogins = 0
	}
	return s.q().SetLoginFailures(ctx, params)
}

// 帳號不存在時也做一次雜湊，避免從回應時間猜出帳號是否存在
var dummyHash, _ = auth.TestParams.Hash("dummy")

// Login 登入。目前是訪客時，依 bringGuest 把訪客的小朋友帶進來或放棄。
func (s *Service) Login(ctx context.Context, sess *Session, username, password string, bringGuest bool) (api.Me, *Issued, error) {
	lower := strings.ToLower(username)
	a, err := s.q().GetAccountByUsernameForUpdate(ctx, &lower)
	if errors.Is(err, pgx.ErrNoRows) {
		_, _ = auth.Verify(password, dummyHash)
		return api.Me{}, nil, apperr.InvalidCredentials
	}
	if err != nil {
		return api.Me{}, nil, err
	}
	if err := s.checkLock(a); err != nil {
		return api.Me{}, nil, err
	}
	ok, err := auth.Verify(password, *a.PasswordHash)
	if err != nil {
		return api.Me{}, nil, err
	}
	if !ok {
		if err := s.recordFailure(ctx, a); err != nil {
			return api.Me{}, nil, err
		}
		return api.Me{}, nil, apperr.InvalidCredentials
	}

	var me api.Me
	var issued *Issued
	err = s.tx(ctx, func(q *store.Queries) error {
		if err := q.SetLoginFailures(ctx, store.SetLoginFailuresParams{ID: a.ID}); err != nil {
			return err
		}
		if sess != nil && sess.Account.ID != a.ID {
			if sess.Account.IsGuest {
				if bringGuest {
					if err := s.moveGuestChildren(ctx, q, sess.Account.ID, a.ID); err != nil {
						return err
					}
				}
				if err := q.DeleteAccount(ctx, sess.Account.ID); err != nil {
					return err
				}
			} else if err := q.DeleteSession(ctx, sess.TokenHash); err != nil {
				return err
			}
		} else if sess != nil {
			if err := q.DeleteSession(ctx, sess.TokenHash); err != nil {
				return err
			}
		}
		if issued, err = s.issue(ctx, q, a.ID, false); err != nil {
			return err
		}
		me, err = s.me(ctx, q, a)
		return err
	})
	return me, issued, err
}

func (s *Service) moveGuestChildren(ctx context.Context, q *store.Queries, from, to uuid.UUID) error {
	n1, err := q.CountChildren(ctx, from)
	if err != nil {
		return err
	}
	n2, err := q.CountChildren(ctx, to)
	if err != nil {
		return err
	}
	if n1+n2 > MaxChildren {
		return apperr.ChildLimit
	}
	return q.MoveChildren(ctx, store.MoveChildrenParams{AccountID: from, AccountID_2: to})
}

// Logout 刪除目前裝置的 session。
func (s *Service) Logout(ctx context.Context, sess *Session) error {
	if sess == nil {
		return nil
	}
	return s.q().DeleteSession(ctx, sess.TokenHash)
}

// ResetPassword 用救援碼重設密碼：舊救援碼失效、所有舊 session 失效，並為目前裝置建立新 session。
func (s *Service) ResetPassword(ctx context.Context, username, rescueCode, newPassword string) (api.RegisterResult, *Issued, error) {
	lower := strings.ToLower(username)
	a, err := s.q().GetAccountByUsernameForUpdate(ctx, &lower)
	if errors.Is(err, pgx.ErrNoRows) || (err == nil && a.IsGuest) {
		_, _ = auth.Verify(rescueCode, dummyHash)
		return api.RegisterResult{}, nil, apperr.InvalidRescueCode
	}
	if err != nil {
		return api.RegisterResult{}, nil, err
	}
	if err := s.checkLock(a); err != nil {
		return api.RegisterResult{}, nil, err
	}
	ok, err := auth.Verify(auth.NormalizeRescueCode(rescueCode), *a.RescueCodeHash)
	if err != nil {
		return api.RegisterResult{}, nil, err
	}
	if !ok {
		if err := s.recordFailure(ctx, a); err != nil {
			return api.RegisterResult{}, nil, err
		}
		return api.RegisterResult{}, nil, apperr.InvalidRescueCode
	}
	pwHash, rescue, rescueHash, err := s.newCredentials(newPassword)
	if err != nil {
		return api.RegisterResult{}, nil, err
	}
	var out api.RegisterResult
	var issued *Issued
	err = s.tx(ctx, func(q *store.Queries) error {
		if err := q.UpdateCredentials(ctx, store.UpdateCredentialsParams{ID: a.ID, PasswordHash: &pwHash, RescueCodeHash: &rescueHash}); err != nil {
			return err
		}
		if err := q.DeleteAccountSessions(ctx, a.ID); err != nil {
			return err
		}
		if issued, err = s.issue(ctx, q, a.ID, false); err != nil {
			return err
		}
		me, err := s.me(ctx, q, a)
		out = api.RegisterResult{Me: me, RescueCode: rescue}
		return err
	})
	return out, issued, err
}

// GetMe 回傳目前帳號。
func (s *Service) GetMe(ctx context.Context, sess *Session) (api.Me, error) {
	if err := requireSession(sess); err != nil {
		return api.Me{}, err
	}
	return s.me(ctx, s.q(), sess.Account)
}

// verifyPassword 用於刪除等敏感操作；訪客沒有密碼，一律拒絕。
func (s *Service) verifyPassword(sess *Session, password string) error {
	if err := requireSession(sess); err != nil {
		return err
	}
	if sess.Account.IsGuest || sess.Account.PasswordHash == nil {
		return apperr.GuestForbidden
	}
	ok, err := auth.Verify(password, *sess.Account.PasswordHash)
	if err != nil {
		return err
	}
	if !ok {
		return apperr.WrongPassword
	}
	return nil
}

// DeleteMe 刪除整個帳號（含所有小朋友與進度）。
func (s *Service) DeleteMe(ctx context.Context, sess *Session, password string) error {
	if err := s.verifyPassword(sess, password); err != nil {
		return err
	}
	return s.q().DeleteAccount(ctx, sess.Account.ID)
}

// AdminResetPassword 由管理者在伺服器上重設密碼（FR-052），回傳臨時密碼與新的救援碼。
func (s *Service) AdminResetPassword(ctx context.Context, username string) (tempPassword, rescueCode string, err error) {
	lower := strings.ToLower(username)
	a, err := s.q().GetAccountByUsernameForUpdate(ctx, &lower)
	if err != nil {
		return "", "", notFound(err)
	}
	tempPassword = auth.NewTemporaryPassword()
	pwHash, rescueCode, rescueHash, err := s.newCredentials(tempPassword)
	if err != nil {
		return "", "", err
	}
	err = s.tx(ctx, func(q *store.Queries) error {
		if err := q.UpdateCredentials(ctx, store.UpdateCredentialsParams{ID: a.ID, PasswordHash: &pwHash, RescueCodeHash: &rescueHash}); err != nil {
			return err
		}
		return q.DeleteAccountSessions(ctx, a.ID)
	})
	return tempPassword, rescueCode, err
}

func (s *Service) createChild(ctx context.Context, q *store.Queries, accountID uuid.UUID, nickname, avatar string, stage content.Stage) (store.Child, error) {
	return q.CreateChild(ctx, store.CreateChildParams{
		ID: uuid.New(), AccountID: accountID, Nickname: nickname, Avatar: avatar,
		StartStage: string(stage), UnlockedCount: int32(progress.StartZones(stage)),
	})
}
