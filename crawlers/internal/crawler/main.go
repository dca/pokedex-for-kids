package crawler

import (
	"fmt"
	"log"
)

func main() {
	Start()
}

func Start() {
	log.Println("Starting to fetch Pokedex")

	pokedexData, err := GetBasePokedexV2()
	if err != nil {
		log.Fatalf("Failed to fetch Pokedex: %v", err)
	}

	log.Printf("Successfully fetched data for %d Pokemon", len(pokedexData))

	for _, pokemon := range pokedexData {
		processPokemon(pokemon)
	}
}

func synthesizeAudio(enName, chineseName string, id int) {
	err := SynthesizeText("en-US", enName, fmt.Sprintf("assets/mp3/en/%d-%s.mp3", id, enName))
	if err != nil {
		log.Printf("Failed to synthesize English audio: %v", err)
	}

	err = SynthesizeText("zh-TW", chineseName, fmt.Sprintf("assets/mp3/zh-TW/%d-%s.mp3", id, chineseName))
	if err != nil {
		log.Printf("Failed to synthesize Chinese audio: %v", err)
	}
}
