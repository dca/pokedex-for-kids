package server

import (
	"context"

	"game-api/internal/api"
	"game-api/internal/content"
	"game-api/internal/service"
)

type handlers struct {
	svc  *service.Service
	opts Options
}

var _ api.StrictServerInterface = (*handlers)(nil)

func (h *handlers) Healthz(ctx context.Context, _ api.HealthzRequestObject) (api.HealthzResponseObject, error) {
	if err := h.svc.DB.Ping(ctx); err != nil {
		return nil, err
	}
	return api.Healthz200JSONResponse{Ok: true}, nil
}

func (h *handlers) StartGuest(ctx context.Context, _ api.StartGuestRequestObject) (api.StartGuestResponseObject, error) {
	me, issued, created, err := h.svc.StartGuest(ctx, sessionFrom(ctx))
	if err != nil {
		return nil, err
	}
	if !created {
		return api.StartGuest200JSONResponse(me), nil
	}
	return api.StartGuest201JSONResponse{Body: me, Headers: api.StartGuest201ResponseHeaders{SetCookie: h.cookieString(issued)}}, nil
}

func (h *handlers) Register(ctx context.Context, req api.RegisterRequestObject) (api.RegisterResponseObject, error) {
	out, issued, err := h.svc.Register(ctx, sessionFrom(ctx), req.Body.Username, req.Body.Password)
	if err != nil {
		return nil, err
	}
	return api.Register201JSONResponse{Body: out, Headers: api.Register201ResponseHeaders{SetCookie: h.cookieString(issued)}}, nil
}

func (h *handlers) Login(ctx context.Context, req api.LoginRequestObject) (api.LoginResponseObject, error) {
	bring := req.Body.BringGuestChildren != nil && *req.Body.BringGuestChildren
	me, issued, err := h.svc.Login(ctx, sessionFrom(ctx), req.Body.Username, req.Body.Password, bring)
	if err != nil {
		return nil, err
	}
	return api.Login200JSONResponse{Body: me, Headers: api.Login200ResponseHeaders{SetCookie: h.cookieString(issued)}}, nil
}

func (h *handlers) Logout(ctx context.Context, _ api.LogoutRequestObject) (api.LogoutResponseObject, error) {
	if err := h.svc.Logout(ctx, sessionFrom(ctx)); err != nil {
		return nil, err
	}
	h.clearCookie(ctx)
	return api.Logout204Response{}, nil
}

func (h *handlers) ResetPassword(ctx context.Context, req api.ResetPasswordRequestObject) (api.ResetPasswordResponseObject, error) {
	out, issued, err := h.svc.ResetPassword(ctx, req.Body.Username, req.Body.RescueCode, req.Body.NewPassword)
	if err != nil {
		return nil, err
	}
	return api.ResetPassword200JSONResponse{Body: out, Headers: api.ResetPassword200ResponseHeaders{SetCookie: h.cookieString(issued)}}, nil
}

func (h *handlers) GetMe(ctx context.Context, _ api.GetMeRequestObject) (api.GetMeResponseObject, error) {
	me, err := h.svc.GetMe(ctx, sessionFrom(ctx))
	if err != nil {
		return nil, err
	}
	return api.GetMe200JSONResponse(me), nil
}

func (h *handlers) DeleteMe(ctx context.Context, req api.DeleteMeRequestObject) (api.DeleteMeResponseObject, error) {
	if err := h.svc.DeleteMe(ctx, sessionFrom(ctx), req.Body.Password); err != nil {
		return nil, err
	}
	h.clearCookie(ctx)
	return api.DeleteMe204Response{}, nil
}

func (h *handlers) CreateChild(ctx context.Context, req api.CreateChildRequestObject) (api.CreateChildResponseObject, error) {
	c, err := h.svc.CreateChild(ctx, sessionFrom(ctx), *req.Body)
	if err != nil {
		return nil, err
	}
	return api.CreateChild201JSONResponse(c), nil
}

func (h *handlers) UpdateChild(ctx context.Context, req api.UpdateChildRequestObject) (api.UpdateChildResponseObject, error) {
	c, err := h.svc.UpdateChild(ctx, sessionFrom(ctx), req.ChildId, req.Body.Nickname, req.Body.Avatar)
	if err != nil {
		return nil, err
	}
	return api.UpdateChild200JSONResponse(c), nil
}

func (h *handlers) DeleteChild(ctx context.Context, req api.DeleteChildRequestObject) (api.DeleteChildResponseObject, error) {
	if err := h.svc.DeleteChild(ctx, sessionFrom(ctx), req.ChildId, req.Body.Password); err != nil {
		return nil, err
	}
	return api.DeleteChild204Response{}, nil
}

func (h *handlers) GetChildState(ctx context.Context, req api.GetChildStateRequestObject) (api.GetChildStateResponseObject, error) {
	st, err := h.svc.State(ctx, sessionFrom(ctx), req.ChildId)
	if err != nil {
		return nil, err
	}
	return api.GetChildState200JSONResponse(st), nil
}

func (h *handlers) ChoosePartner(ctx context.Context, req api.ChoosePartnerRequestObject) (api.ChoosePartnerResponseObject, error) {
	st, err := h.svc.ChoosePartner(ctx, sessionFrom(ctx), req.ChildId, int(req.Body.PokemonId))
	if err != nil {
		return nil, err
	}
	return api.ChoosePartner200JSONResponse(st), nil
}

func (h *handlers) CreateEncounter(ctx context.Context, req api.CreateEncounterRequestObject) (api.CreateEncounterResponseObject, error) {
	e, err := h.svc.CreateEncounter(ctx, sessionFrom(ctx), req.ChildId, content.ZoneID(req.Body.Zone), string(req.Body.Kind), forcePokemon(ctx))
	if err != nil {
		return nil, err
	}
	return api.CreateEncounter201JSONResponse(e), nil
}

func (h *handlers) SubmitAnswer(ctx context.Context, req api.SubmitAnswerRequestObject) (api.SubmitAnswerResponseObject, error) {
	if err := h.svc.SubmitAnswer(ctx, sessionFrom(ctx), req.EncounterId, req.QuestionIndex, req.Body.WrongCount, req.Body.DurationMs); err != nil {
		return nil, err
	}
	return api.SubmitAnswer204Response{}, nil
}

func (h *handlers) CompleteEncounter(ctx context.Context, req api.CompleteEncounterRequestObject) (api.CompleteEncounterResponseObject, error) {
	res, err := h.svc.CompleteEncounter(ctx, sessionFrom(ctx), req.EncounterId)
	if err != nil {
		return nil, err
	}
	return api.CompleteEncounter200JSONResponse(res), nil
}
