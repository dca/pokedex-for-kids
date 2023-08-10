package crawler

import (
	"encoding/json"
	"fmt"
	"log"
	"os"

	"github.com/gocolly/colly/v2"
)

type PokedexBaseData struct {
	Index  string `json:"index"`
	NameEn string `json:"name-en"`
	NameTw string `json:"name-tw"`
}

func GetBasePokedex() ([]PokedexBaseData, error) {
	c := colly.NewCollector()

	var results []PokedexBaseData

	c.OnHTML(".eplist tr", func(e *colly.HTMLElement) {
		index := e.ChildText("td:nth-child(1)")
		nameTw := e.ChildText("td:nth-child(2) a")
		nameEn := e.ChildText("td:nth-child(4) a")

		if index != "" && nameEn != "" && nameTw != "" {
			results = append(results, PokedexBaseData{
				Index:  index,
				NameTw: nameTw,
				NameEn: nameEn,
			})
		}
	})

	pokedexUrl := "https://wiki.52poke.com/zh-hant/%E5%AE%9D%E5%8F%AF%E6%A2%A6%E5%88%97%E8%A1%A8%EF%BC%88%E6%8C%89%E5%85%A8%E5%9B%BD%E5%9B%BE%E9%89%B4%E7%BC%96%E5%8F%B7%EF%BC%89/%E7%AE%80%E5%8D%95%E7%89%88"
	err := c.Visit(pokedexUrl)
	if err != nil {
		log.Fatal(err)
	}

	file, err := json.MarshalIndent(results, "", " ")
	if err != nil {
		log.Fatal(err)
	}
	
	err = os.WriteFile("assets/base-pokedex.json", file, 0644)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Data saved to output.json!")

	return results, nil
}
