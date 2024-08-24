package crawler

import (
	"log"

	"github.com/mtslzr/pokeapi-go"
	"github.com/mtslzr/pokeapi-go/structs"
)

func GetBasePokedexV2() ([]structs.Result, error) {
	var allResources []structs.Result

	for {
		pokemons, err := pokeapi.Resource("pokemon-species", len(allResources))

		log.Println("get offset ", len(allResources))

		if err != nil {
			return nil, err
		}

		if len(pokemons.Results) == 0 {
			break
		}

		allResources = append(allResources, pokemons.Results...)

	}

	return allResources, nil
}
