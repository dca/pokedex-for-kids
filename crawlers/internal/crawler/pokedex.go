package crawler

import (
	"log"

	"github.com/mtslzr/pokeapi-go"
	"github.com/mtslzr/pokeapi-go/structs"
)

func processPokemon(pokemon structs.Result) {
	log.Printf("Processing %s", pokemon.Name)

	pokemonDetails, err := getPokemonDetails(pokemon.Name)
	if err != nil {
		log.Printf("Failed to get details for %s: %v", pokemon.Name, err)
		return
	}

	speciesDetails, err := getPokemonSpecies(pokemonDetails.Species.Name)
	if err != nil {
		log.Printf("Failed to get species info for %s: %v", pokemon.Name, err)
		return
	}

	enName := pokemon.Name
	chineseName := getChineseName(speciesDetails)

	log.Printf("Name: %s (English), %s (Chinese)", enName, chineseName)

	synthesizeAudio(enName, chineseName, speciesDetails.ID)
}

func getPokemonDetails(name string) (structs.Pokemon, error) {
	return pokeapi.Pokemon(name)
}

func getPokemonSpecies(name string) (structs.PokemonSpecies, error) {
	return pokeapi.PokemonSpecies(name)
}

func getChineseName(speciesDetails structs.PokemonSpecies) string {
	names := speciesDetails.Names

	for _, name := range names {
		if name.Language.Name == "zh-Hant" {
			return name.Name
		}
	}
	return ""
}
