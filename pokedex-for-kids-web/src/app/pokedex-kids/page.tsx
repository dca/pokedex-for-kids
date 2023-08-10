"use client"
import React, { useRef } from 'react';
import pokedex from '../../../../crawlers/assets/base-pokedex.json';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pokemonRow: {
    display: 'flex',
    alignItems: 'center',
    margin: '10px 0',
    padding: '10px',
    border: '1px solid #ddd',
    boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.1)'
  },
  pokemonName: {
    marginRight: '10px'
  },
  pokemonImage: {
    width: '100px',
  },
  playButton: {
    marginLeft: '10px'
  }
};

export default function Page() {
  const handlePlayAudio = (audioRef: React.RefObject<HTMLAudioElement>, pokemonName: string) => {
    console.log('pokemonName', pokemonName);
    console.log('audioRef', audioRef);
    if (audioRef.current) {
      audioRef.current.src = `mp3/${pokemonName.replace('#', '')}.mp3`;
      audioRef.current.play();
    }
  };

  return (
    <div style={styles.container}>
      <h1>Pokedex!</h1>
      {pokedex.map((pokemon, index) => {
        const audioRef = useRef<HTMLAudioElement>(null);

        return (
          <div key={index} style={styles.pokemonRow}>
            <h2 style={styles.pokemonName}>
              {pokemon['index']} - {pokemon['name-tw']} - {pokemon['name-en']}
            </h2>
            <img 
              style={styles.pokemonImage}
              src={`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${(pokemon['index'].replace('#0', '#').replace('#', ''))}.png`} 
              alt={pokemon['name-en']} 
            />
            <button style={styles.playButton} onClick={() => handlePlayAudio(audioRef, `${pokemon['index']}-${pokemon['name-en']}`)}>Play</button>
            <audio ref={audioRef} />
          </div>
        );
      })}
    </div>
  );
}
