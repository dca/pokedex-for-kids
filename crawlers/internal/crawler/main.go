package crawler

func main() {

}

func Start() {
	pokedexData, err := GetBasePokedex()
	if err != nil {
		panic(err)
	}

	for _, pokemon := range pokedexData {
		// err := SynthesizeText("en-US", pokemon.NameEn, "assets/mp3/" + pokemon.Index + "-" + pokemon.NameEn + ".mp3")
		// if err != nil {
		// 	panic(err)
		// }

		// err := SynthesizeText("zh-TW", pokemon.NameTw, "assets/mp3/" + pokemon.Index + "-" + pokemon.NameTw + ".mp3")
		// if err != nil {
		// 	panic(err)
		// }
	}

	if err != nil {
		panic(err)
	}
}