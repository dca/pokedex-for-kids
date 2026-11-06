// Package apperr 定義回傳給前端的錯誤（code 對應 openapi 的 Error.code）。
package apperr

import (
	"errors"
	"net/http"
)

type Error struct {
	Status     int
	Code       string
	Message    string
	RetryAfter int // 秒；只用於 429
}

func (e *Error) Error() string { return e.Code + ": " + e.Message }

func New(status int, code, message string) *Error {
	return &Error{Status: status, Code: code, Message: message}
}

var (
	Unauthorized        = New(http.StatusUnauthorized, "unauthorized", "請先開始遊戲或登入")
	InvalidCredentials  = New(http.StatusUnauthorized, "invalid_credentials", "帳號或密碼不正確")
	InvalidRescueCode   = New(http.StatusUnauthorized, "invalid_credentials", "帳號或救援碼不正確")
	UsernameTaken       = New(http.StatusConflict, "username_taken", "這個帳號名稱已經有人使用，請換一個")
	AlreadyRegistered   = New(http.StatusConflict, "already_registered", "目前已經登入正式帳號")
	WrongPassword       = New(http.StatusForbidden, "forbidden", "密碼不正確")
	GuestForbidden      = New(http.StatusForbidden, "forbidden", "請先註冊帳號才能這樣做")
	NotFound            = New(http.StatusNotFound, "not_found", "找不到")
	ChildLimit          = New(http.StatusUnprocessableEntity, "child_limit_reached", "一個帳號最多 8 個小朋友")
	ZoneLocked          = New(http.StatusForbidden, "zone_locked", "這個區域還沒開放")
	PartnerRequired     = New(http.StatusConflict, "partner_required", "請先選擇夥伴")
	PartnerChosen       = New(http.StatusConflict, "partner_already_chosen", "已經選過夥伴了")
	AnswerConflict      = New(http.StatusConflict, "answer_conflict", "這題已經作答過了")
	EncounterIncomplete = New(http.StatusConflict, "encounter_incomplete", "還有題目沒有作答")
	UnsupportedMedia    = New(http.StatusUnsupportedMediaType, "validation_failed", "請以 JSON 送出")
)

func Locked(retryAfter int) *Error {
	return &Error{Status: http.StatusTooManyRequests, Code: "locked", Message: "嘗試太多次了，請稍後再試", RetryAfter: retryAfter}
}

func Validation(message string) *Error {
	return New(http.StatusBadRequest, "validation_failed", message)
}

// As 取出 *Error；不是的話回傳 internal 錯誤。
func As(err error) *Error {
	var e *Error
	if errors.As(err, &e) {
		return e
	}
	return New(http.StatusInternalServerError, "internal", "伺服器發生錯誤，請稍後再試")
}
