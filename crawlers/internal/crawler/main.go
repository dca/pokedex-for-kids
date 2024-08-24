package crawler

import (
	"fmt"
	"log"

	"github.com/mtslzr/pokeapi-go"
)

func main() {
	Start()
}

func Start() {
	log.Println("try to get pokedex")

	pokedexData, err := GetBasePokedexV2()

	log.Println("pokedexData", pokedexData)

	if err != nil {
		panic(err)
	}

	log.Println("try to processing one by one")

	for _, pokemon := range pokedexData {

		enName := ""
		chineseName := ""

		log.Println("try to processing %s", pokemon.Name)

		// 獲取每個寶可夢的詳細信息
		pokemonDetails, err := pokeapi.Pokemon(pokemon.Name)
		if err != nil {
			fmt.Printf("獲取 %s 的詳細信息失敗: %v\n", pokemon.Name, err)
			continue
		}

		// 獲取寶可夢的種類信息
		speciesDetails, err := pokeapi.PokemonSpecies(pokemonDetails.Species.Name)
		if err != nil {
			fmt.Printf("獲取 %s 的種類信息失敗: %v\n", pokemon.Name, err)
			continue
		}

		enName = pokemon.Name

		// 查找中文名稱
		for _, name := range speciesDetails.Names {
			if name.Language.Name == "zh-Hant" {
				chineseName = name.Name
				break
			}
		}

		log.Println("name", enName, chineseName)

		err = SynthesizeText("en-US", enName, "assets/mp3/en/"+fmt.Sprintf("%d", speciesDetails.ID)+"-"+enName+".mp3")
		if err != nil {
			panic(err)
		}

		err = SynthesizeText("zh-TW", chineseName, "assets/mp3/zh-TW/"+fmt.Sprintf("%d", speciesDetails.ID)+"-"+chineseName+".mp3")
		if err != nil {
			panic(err)
		}
	}

	if err != nil {
		panic(err)
	}
}
