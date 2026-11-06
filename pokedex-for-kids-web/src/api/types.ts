// API 型別的別名（由 openapi-typescript 產生的 schema.ts 而來，不手寫）。
import type { components } from './schema'

type S = components['schemas']

export type Me = S['Me']
export type Child = S['Child']
export type ChildInput = S['ChildInput']
export type ChildState = S['ChildState']
export type Partner = S['Partner']
export type CaughtEntry = S['CaughtEntry']
export type Encounter = S['Encounter']
export type EncounterResult = S['EncounterResult']
export type Question = S['Question']
export type QuestionType = S['QuestionType']
export type Option = S['Option']
export type PromptPart = S['PromptPart']
export type DisplayCell = S['DisplayCell']
export type QuestionDisplay = S['QuestionDisplay']
export type RegisterResult = S['RegisterResult']
export type ApiErrorBody = S['Error']
export type ZoneId = S['ZoneId']
export type Stage = S['Stage']
