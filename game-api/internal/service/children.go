package service

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"game-api/internal/api"
	"game-api/internal/apperr"
	"game-api/internal/content"
	"game-api/internal/game/mastery"
	"game-api/internal/game/progress"
	"game-api/internal/store"
)

func isUniqueViolation(err error) bool {
	var pg *pgconn.PgError
	return errors.As(err, &pg) && pg.Code == "23505"
}

// CreateChild 建立小朋友檔案（最多 8 個）。
func (s *Service) CreateChild(ctx context.Context, sess *Session, in api.ChildInput) (api.Child, error) {
	if err := requireSession(sess); err != nil {
		return api.Child{}, err
	}
	var out api.Child
	err := s.tx(ctx, func(q *store.Queries) error {
		n, err := q.CountChildren(ctx, sess.Account.ID)
		if err != nil {
			return err
		}
		if n >= MaxChildren {
			return apperr.ChildLimit
		}
		c, err := s.createChild(ctx, q, sess.Account.ID, in.Nickname, in.Avatar, content.Stage(in.StartStage))
		out = childDTO(c)
		return err
	})
	return out, err
}

// UpdateChild 修改暱稱或頭像。
func (s *Service) UpdateChild(ctx context.Context, sess *Session, id uuid.UUID, nickname, avatar *string) (api.Child, error) {
	if err := requireSession(sess); err != nil {
		return api.Child{}, err
	}
	c, err := s.q().UpdateChildProfile(ctx, store.UpdateChildProfileParams{ID: id, AccountID: sess.Account.ID, Nickname: nickname, Avatar: avatar})
	if err != nil {
		return api.Child{}, notFound(err)
	}
	return childDTO(c), nil
}

// DeleteChild 刪除小朋友檔案與所有進度；需要密碼。
func (s *Service) DeleteChild(ctx context.Context, sess *Session, id uuid.UUID, password string) error {
	if err := s.verifyPassword(sess, password); err != nil {
		return err
	}
	n, err := s.q().DeleteChild(ctx, store.DeleteChildParams{ID: id, AccountID: sess.Account.ID})
	if err != nil {
		return err
	}
	if n == 0 {
		return apperr.NotFound
	}
	return nil
}

// ChoosePartner 選擇夥伴；只能選一次。
func (s *Service) ChoosePartner(ctx context.Context, sess *Session, id uuid.UUID, pokemonID int) (api.ChildState, error) {
	if err := requireSession(sess); err != nil {
		return api.ChildState{}, err
	}
	child, err := s.q().GetChild(ctx, store.GetChildParams{ID: id, AccountID: sess.Account.ID})
	if err != nil {
		return api.ChildState{}, notFound(err)
	}
	if child.PartnerBaseID != nil {
		return api.ChildState{}, apperr.PartnerChosen
	}
	base := int32(pokemonID)
	if _, err := s.q().SetPartner(ctx, store.SetPartnerParams{ID: id, PartnerBaseID: &base}); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return api.ChildState{}, apperr.PartnerChosen
		}
		return api.ChildState{}, err
	}
	return s.State(ctx, sess, id)
}

// snapshot 讀取出題與結算需要的資料。
type snapshot struct {
	child   store.Child
	mastery map[content.ItemID]mastery.Entry
	caught  []store.Caught
	badges  []store.Badge
}

func (s *Service) load(ctx context.Context, q *store.Queries, child store.Child) (snapshot, error) {
	snap := snapshot{child: child, mastery: map[content.ItemID]mastery.Entry{}}
	rows, err := q.ListMastery(ctx, child.ID)
	if err != nil {
		return snap, err
	}
	for _, r := range rows {
		e := mastery.Entry{Level: int(r.Level), DueAt: r.DueAt, LastSeenAt: r.LastSeenAt}
		if r.DueEncounter != nil {
			v := int(*r.DueEncounter)
			e.DueEncounter = &v
		}
		snap.mastery[content.ItemID(r.ItemID)] = e
	}
	if snap.caught, err = q.ListCaught(ctx, child.ID); err != nil {
		return snap, err
	}
	snap.badges, err = q.ListBadges(ctx, child.ID)
	return snap, err
}

func (s *Service) unlocked(snap snapshot) []content.ZoneID {
	return progress.UnlockedZones(s.Content, content.Stage(snap.child.StartStage), snap.mastery)
}

func (s *Service) stateDTO(snap snapshot) api.ChildState {
	c := snap.child
	out := api.ChildState{
		Child:          childDTO(c),
		Caught:         make([]api.CaughtEntry, 0, len(snap.caught)),
		Badges:         make([]api.Badge, 0, len(snap.badges)),
		CorrectStreak:  int(c.CorrectStreak),
		EncounterCount: int(c.EncounterCount),
		AllCaught:      len(snap.caught) >= len(s.Content.PokemonList),
	}
	if c.PartnerBaseID != nil {
		f := progress.Partner(s.Content, int(*c.PartnerBaseID), int(c.Xp))
		out.Partner = &api.Partner{BaseId: api.PartnerBaseId(*c.PartnerBaseID), CurrentId: f.CurrentID, Xp: int(c.Xp), NextEvolutionXp: f.NextEvolutionXP, Title: f.Title}
	}
	for _, x := range snap.caught {
		out.Caught = append(out.Caught, api.CaughtEntry{PokemonId: int(x.PokemonID), BestStars: int(x.BestStars), FirstCaughtAt: x.FirstCaughtAt})
	}
	for _, b := range snap.badges {
		out.Badges = append(out.Badges, api.Badge{Zone: api.ZoneId(b.Zone), EarnedAt: b.EarnedAt})
	}
	for _, z := range s.unlocked(snap) {
		out.UnlockedZones = append(out.UnlockedZones, api.ZoneId(z))
	}
	for _, p := range progress.Progress(s.Content, snap.mastery) {
		out.ZoneProgress = append(out.ZoneProgress, api.ZoneProgress{Zone: api.ZoneId(p.Zone), Familiar: p.Familiar, Total: p.Total})
	}
	return out
}

// State 回傳小朋友的進度。
func (s *Service) State(ctx context.Context, sess *Session, id uuid.UUID) (api.ChildState, error) {
	if err := requireSession(sess); err != nil {
		return api.ChildState{}, err
	}
	q := s.q()
	child, err := q.GetChild(ctx, store.GetChildParams{ID: id, AccountID: sess.Account.ID})
	if err != nil {
		return api.ChildState{}, notFound(err)
	}
	snap, err := s.load(ctx, q, child)
	if err != nil {
		return api.ChildState{}, err
	}
	return s.stateDTO(snap), nil
}
