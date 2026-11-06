// Package content 載入嵌入執行檔的靜態內容（由前端的 npm run content 產生）。
package content

import (
	"embed"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"game-api/internal/game/zhuyin"
)

//go:embed data/*.json
var dataFS embed.FS

type ZoneID string
type Stage string
type ItemID string

const (
	Meadow ZoneID = "meadow"
	Beach  ZoneID = "beach"
	Forest ZoneID = "forest"
	Hill   ZoneID = "hill"

	StageLearn Stage = "learn"
	StageSpell Stage = "spell"
	StageRead  Stage = "read"
)

// AllZones 依開放順序排列。
var AllZones = []ZoneID{Meadow, Beach, Forest, Hill}

type Syllable struct {
	Char    string `json:"char"`
	IsHan   bool   `json:"isHan"`
	Zhuyin  string `json:"zhuyin"`
	Initial string `json:"-"`
	Medial  string `json:"-"`
	Final   string `json:"-"`
	Tone    int    `json:"tone"`
}

// Parsed 回傳拆開的音節。
func (s Syllable) Parsed() zhuyin.Syllable {
	return zhuyin.Syllable{Initial: s.Initial, Medial: s.Medial, Final: s.Final, Tone: s.Tone}
}

type Pokemon struct {
	ID        int        `json:"id"`
	Name      string     `json:"name"`
	En        string     `json:"en"`
	Zone      ZoneID     `json:"zone"`
	Rare      bool       `json:"rare"`
	EvolvesTo *int       `json:"evolvesTo"`
	Syllables []Syllable `json:"syllables"`
}

// Han 回傳名稱中的漢字音節與它們在名稱中的位置。
func (p Pokemon) Han() (idx []int) {
	for i, s := range p.Syllables {
		if s.IsHan {
			idx = append(idx, i)
		}
	}
	return idx
}

// Zhuyin 回傳整個名稱的注音（以空白分隔），用於判斷同音名稱。
func (p Pokemon) Zhuyin() string {
	parts := make([]string, 0, len(p.Syllables))
	for _, s := range p.Syllables {
		parts = append(parts, s.Zhuyin)
	}
	return strings.Join(parts, " ")
}

type Zone struct {
	ID            ZoneID   `json:"id"`
	Name          string   `json:"name"`
	Stage         Stage    `json:"stage"`
	Order         int      `json:"order"`
	Items         []ItemID `json:"items"`
	QuestionTypes []string `json:"questionTypes"`
}

type Confusables struct {
	Symbols [][]string `json:"symbols"`
	Tones   [][]int    `json:"tones"`
	Chars   [][]string `json:"chars"`
}

// Content 是載入並建立索引後的靜態內容，建立後唯讀，可以在多個 goroutine 共用。
type Content struct {
	Pokemon     map[int]Pokemon
	PokemonList []Pokemon
	Zones       []Zone
	Confusables Confusables

	zoneByID map[ZoneID]Zone
	// CharZhuyin 是每個漢字在第一世代名稱中的讀音（同一字多個讀音時全部保留）
	CharZhuyin map[string][]string
	// HanChars 是第一世代名稱中所有不重複的漢字，依出現順序
	HanChars []string
}

// Zone 依 ID 取得區域。
func (c *Content) Zone(id ZoneID) (Zone, bool) {
	z, ok := c.zoneByID[id]
	return z, ok
}

// ZoneIndex 回傳區域的開放順序（0 起算），不存在時為 -1。
func ZoneIndex(id ZoneID) int {
	for i, z := range AllZones {
		if z == id {
			return i
		}
	}
	return -1
}

// InZone 回傳某區的寶可夢，依編號排序。
func (c *Content) InZone(id ZoneID) []Pokemon {
	var out []Pokemon
	for _, p := range c.PokemonList {
		if p.Zone == id {
			out = append(out, p)
		}
	}
	return out
}

// Load 載入嵌入的正式內容。
func Load() (*Content, error) {
	read := func(name string, v any) error {
		b, err := dataFS.ReadFile("data/" + name)
		if err != nil {
			return fmt.Errorf("讀取 %s：%w（請先執行 npm run content）", name, err)
		}
		return json.Unmarshal(b, v)
	}
	var list []Pokemon
	var zones []Zone
	var conf Confusables
	if err := read("gen1.json", &list); err != nil {
		return nil, err
	}
	if err := read("zones.json", &zones); err != nil {
		return nil, err
	}
	if err := read("confusables.json", &conf); err != nil {
		return nil, err
	}
	return Build(list, zones, conf)
}

// MustLoad 用於程式啟動與測試。
func MustLoad() *Content {
	c, err := Load()
	if err != nil {
		panic(err)
	}
	return c
}

// Build 驗證並建立索引。
func Build(list []Pokemon, zones []Zone, conf Confusables) (*Content, error) {
	c := &Content{
		Pokemon:     make(map[int]Pokemon, len(list)),
		Zones:       zones,
		Confusables: conf,
		zoneByID:    make(map[ZoneID]Zone, len(zones)),
		CharZhuyin:  map[string][]string{},
	}
	sort.Slice(c.Zones, func(i, j int) bool { return c.Zones[i].Order < c.Zones[j].Order })
	for _, z := range c.Zones {
		c.zoneByID[z.ID] = z
	}
	for _, id := range AllZones {
		if _, ok := c.zoneByID[id]; !ok {
			return nil, fmt.Errorf("缺少區域 %s", id)
		}
	}
	seenChar := map[string]bool{}
	for _, p := range list {
		for i, s := range p.Syllables {
			if !s.IsHan {
				continue
			}
			parsed, err := zhuyin.Parse(s.Zhuyin)
			if err != nil {
				return nil, fmt.Errorf("#%d %s：%w", p.ID, p.Name, err)
			}
			s.Initial, s.Medial, s.Final, s.Tone = parsed.Initial, parsed.Medial, parsed.Final, parsed.Tone
			p.Syllables[i] = s
			if !contains(c.CharZhuyin[s.Char], s.Zhuyin) {
				c.CharZhuyin[s.Char] = append(c.CharZhuyin[s.Char], s.Zhuyin)
			}
			if !seenChar[s.Char] {
				seenChar[s.Char] = true
				c.HanChars = append(c.HanChars, s.Char)
			}
		}
		if _, ok := c.zoneByID[p.Zone]; !ok {
			return nil, fmt.Errorf("#%d 的區域 %s 不存在", p.ID, p.Zone)
		}
		c.Pokemon[p.ID] = p
	}
	c.PokemonList = make([]Pokemon, 0, len(c.Pokemon))
	for _, p := range c.Pokemon {
		c.PokemonList = append(c.PokemonList, p)
	}
	sort.Slice(c.PokemonList, func(i, j int) bool { return c.PokemonList[i].ID < c.PokemonList[j].ID })
	return c, nil
}

func contains(xs []string, x string) bool {
	for _, v := range xs {
		if v == x {
			return true
		}
	}
	return false
}
