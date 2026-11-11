package service

import (
	"context"
	"encoding/json"
	"errors"
	"slices"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"game-api/internal/api"
	"game-api/internal/apperr"
	"game-api/internal/content"
	"game-api/internal/game/encounter"
	"game-api/internal/game/mastery"
	"game-api/internal/game/progress"
	"game-api/internal/game/questions"
	"game-api/internal/store"
)

// CreateEncounter 由伺服器挑選寶可夢並產生題目。forcePokemon 只在測試掛勾開啟時有效。
func (s *Service) CreateEncounter(ctx context.Context, sess *Session, childID uuid.UUID, zone content.ZoneID, kind string, forcePokemon int) (api.Encounter, error) {
	if err := requireSession(sess); err != nil {
		return api.Encounter{}, err
	}
	q := s.q()
	child, err := q.GetChild(ctx, store.GetChildParams{ID: childID, AccountID: sess.Account.ID})
	if err != nil {
		return api.Encounter{}, notFound(err)
	}
	if child.PartnerBaseID == nil {
		return api.Encounter{}, apperr.PartnerRequired
	}
	snap, err := s.load(ctx, q, child)
	if err != nil {
		return api.Encounter{}, err
	}
	if !slices.Contains(s.unlocked(snap), zone) {
		return api.Encounter{}, apperr.ZoneLocked
	}
	es := encounter.Snapshot{
		Mastery: snap.mastery, Caught: map[int]int{}, CorrectStreak: int(child.CorrectStreak),
		EncounterIndex: int(child.EncounterCount), Now: s.Now(), ForcePokemon: forcePokemon,
	}
	for _, c := range snap.caught {
		es.Caught[int(c.PokemonID)] = int(c.BestStars)
	}
	var plan encounter.Plan
	if kind == "gym" {
		plan, err = encounter.PlanGym(s.Content, es, zone, s.NewRand())
	} else {
		plan, err = encounter.PlanWild(s.Content, es, zone, s.NewRand())
	}
	if err != nil {
		return api.Encounter{}, err
	}
	raw, err := json.Marshal(plan.Questions)
	if err != nil {
		return api.Encounter{}, err
	}
	id := uuid.New()
	if err := q.CreateEncounter(ctx, store.CreateEncounterParams{
		ID: id, ChildID: childID, Zone: string(zone), Kind: kind, PokemonID: int32(plan.PokemonID), Questions: raw,
	}); err != nil {
		return api.Encounter{}, err
	}
	var qs []api.Question
	if err := json.Unmarshal(raw, &qs); err != nil {
		return api.Encounter{}, err
	}
	return api.Encounter{Id: id, ChildId: childID, Zone: api.ZoneId(zone), Kind: api.EncounterKind(kind), PokemonId: plan.PokemonID, Questions: qs}, nil
}

func (s *Service) lockEncounter(ctx context.Context, q *store.Queries, sess *Session, id uuid.UUID) (store.Encounter, []questions.Question, error) {
	e, err := q.LockEncounter(ctx, store.LockEncounterParams{ID: id, AccountID: sess.Account.ID})
	if err != nil {
		return e, nil, notFound(err)
	}
	var qs []questions.Question
	err = json.Unmarshal(e.Questions, &qs)
	return e, qs, err
}

// SubmitAnswer 記錄一題的結果並更新熟練度；同樣內容重送只算一次。
func (s *Service) SubmitAnswer(ctx context.Context, sess *Session, encounterID uuid.UUID, index, wrongCount, durationMs int) error {
	if err := requireSession(sess); err != nil {
		return err
	}
	return s.tx(ctx, func(q *store.Queries) error {
		e, qs, err := s.lockEncounter(ctx, q, sess, encounterID)
		if err != nil {
			return err
		}
		if index >= len(qs) {
			return apperr.NotFound
		}
		existing, err := q.GetAnswer(ctx, store.GetAnswerParams{EncounterID: e.ID, QuestionIndex: int32(index)})
		if err == nil {
			if int(existing.WrongCount) == wrongCount {
				return nil // 重送
			}
			return apperr.AnswerConflict
		}
		if !errors.Is(err, pgx.ErrNoRows) {
			return err
		}
		if e.Status == "completed" {
			return apperr.AnswerConflict
		}
		items := qs[index].ItemIDs
		if _, err := q.InsertAnswer(ctx, store.InsertAnswerParams{
			EncounterID: e.ID, QuestionIndex: int32(index), ItemIds: items, WrongCount: int32(wrongCount), DurationMs: int32(durationMs),
		}); err != nil {
			return err
		}
		child, err := q.LockChild(ctx, store.LockChildParams{ID: e.ChildID, AccountID: sess.Account.ID})
		if err != nil {
			return err
		}
		snap, err := s.load(ctx, q, child)
		if err != nil {
			return err
		}
		now := s.Now()
		for _, item := range items {
			next := mastery.Apply(snap.mastery[content.ItemID(item)], wrongCount, int(child.EncounterCount), now)
			params := store.UpsertMasteryParams{ChildID: child.ID, ItemID: item, Level: int32(next.Level), DueAt: next.DueAt, LastSeenAt: next.LastSeenAt}
			if next.DueEncounter != nil {
				v := int32(*next.DueEncounter)
				params.DueEncounter = &v
			}
			if err := q.UpsertMastery(ctx, params); err != nil {
				return err
			}
		}
		return q.UpdateChildProgress(ctx, store.UpdateChildProgressParams{
			ID: child.ID, Xp: child.Xp + 1,
			CorrectStreak:  int32(progress.StreakAfter(int(child.CorrectStreak), wrongCount)),
			EncounterCount: child.EncounterCount, UnlockedCount: child.UnlockedCount,
		})
	})
}

// CompleteEncounter 結算遭遇；重送回傳第一次的結果。
func (s *Service) CompleteEncounter(ctx context.Context, sess *Session, encounterID uuid.UUID) (api.EncounterResult, error) {
	if err := requireSession(sess); err != nil {
		return api.EncounterResult{}, err
	}
	var out api.EncounterResult
	err := s.tx(ctx, func(q *store.Queries) error {
		e, qs, err := s.lockEncounter(ctx, q, sess, encounterID)
		if err != nil {
			return err
		}
		if e.Status == "completed" {
			return json.Unmarshal(e.Result, &out)
		}
		answers, err := q.ListAnswers(ctx, e.ID)
		if err != nil {
			return err
		}
		if len(answers) < len(qs) {
			return apperr.EncounterIncomplete
		}
		child, err := q.LockChild(ctx, store.LockChildParams{ID: e.ChildID, AccountID: sess.Account.ID})
		if err != nil {
			return err
		}
		totalWrong, firstTry := 0, 0
		for _, a := range answers {
			totalWrong += int(a.WrongCount)
			if a.WrongCount == 0 {
				firstTry++
			}
		}
		out = api.EncounterResult{EncounterId: e.ID, Kind: api.EncounterResultKind(e.Kind), XpGained: len(answers), NewlyUnlockedZones: []api.ZoneId{}}
		var stars *int32
		if e.Kind == "gym" {
			passed := progress.GymPassed(firstTry)
			gym := &struct {
				BadgeEarned  bool `json:"badgeEarned"`
				CorrectCount int  `json:"correctCount"`
				Passed       bool `json:"passed"`
			}{CorrectCount: firstTry, Passed: passed}
			if passed {
				n, err := q.InsertBadge(ctx, store.InsertBadgeParams{ChildID: child.ID, Zone: e.Zone})
				if err != nil {
					return err
				}
				gym.BadgeEarned = n == 1
			}
			out.Gym = gym
		} else {
			st := progress.Stars(totalWrong)
			v := int32(st)
			stars = &v
			out.Stars = &st
			inserted, err := q.UpsertCaught(ctx, store.UpsertCaughtParams{ChildID: child.ID, PokemonID: e.PokemonID, BestStars: v})
			if err != nil {
				return err
			}
			out.NewlyCaught = inserted
		}
		if child.PartnerBaseID != nil {
			before := progress.Partner(s.Content, int(*child.PartnerBaseID), int(child.Xp)-len(answers))
			after := progress.Partner(s.Content, int(*child.PartnerBaseID), int(child.Xp))
			if before.CurrentID != after.CurrentID {
				out.Evolved = &struct {
					FromId int `json:"fromId"`
					ToId   int `json:"toId"`
				}{FromId: before.CurrentID, ToId: after.CurrentID}
			}
		}
		snap, err := s.load(ctx, q, child)
		if err != nil {
			return err
		}
		unlocked := s.unlocked(snap)
		for _, z := range unlocked[min(len(unlocked), int(child.UnlockedCount)):] {
			out.NewlyUnlockedZones = append(out.NewlyUnlockedZones, api.ZoneId(z))
		}
		child.EncounterCount++
		child.UnlockedCount = int32(max(len(unlocked), int(child.UnlockedCount)))
		if err := q.UpdateChildProgress(ctx, store.UpdateChildProgressParams{
			ID: child.ID, Xp: child.Xp, CorrectStreak: child.CorrectStreak,
			EncounterCount: child.EncounterCount, UnlockedCount: child.UnlockedCount,
		}); err != nil {
			return err
		}
		snap.child = child
		out.State = s.stateDTO(snap)
		raw, err := json.Marshal(out)
		if err != nil {
			return err
		}
		return q.CompleteEncounter(ctx, store.CompleteEncounterParams{ID: e.ID, Stars: stars, Result: raw})
	})
	return out, err
}
