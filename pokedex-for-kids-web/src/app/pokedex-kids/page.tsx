'use client';
import React, { useRef } from 'react';
import pokedex from '../../../../crawlers/assets/base-pokedex.json';

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Arial', sans-serif",
    backgroundColor: '#f4f4f4',
    minHeight: '100vh',
    padding: '20px 0'
  },
  pokemonRow: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    padding: '20px',
    border: '1px solid #ddd',
    boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.1)',
    borderRadius: '15px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'transform 0.2s'
  },
  pokemonName: {
    flex: 1, // Take up remaining space
    fontSize: '18px',
    marginRight: '20px'
  },
  pokemonImage: {
    width: '100px',
    borderRadius: '10px',
    border: '2px solid #e0e0e0',
    marginRight: '20px'
  },
  title: {
    fontSize: '32px',
    margin: '20px 0',
    color: '#333'
  }
};

interface PokemonRowProps {
  pokemon: {
    'index': string;
    'name-tw': string;
    'name-en': string;
  };
  audioRef: React.RefObject<HTMLAudioElement>;
  handlePlayAudio: (pokemonName: string) => void;
}

const PokemonRow = ({ pokemon, audioRef, handlePlayAudio }: PokemonRowProps) => {
  return (
    <div 
      style={styles.pokemonRow}
      onClick={() => handlePlayAudio(`${pokemon['index']}-${pokemon['name-en']}`)}
      onTouchStart={() => handlePlayAudio(`${pokemon['index']}-${pokemon['name-en']}`)}
    >
      <img 
        style={styles.pokemonImage}
        src={`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${(pokemon['index'].replace('#0', '#').replace('#', ''))}.png`} 
        alt={pokemon['name-en']} 
      />
      <h2 style={styles.pokemonName}>
        {pokemon['index']} - {pokemon['name-tw']} - {pokemon['name-en']}
      </h2>
      <audio ref={audioRef} />
    </div>
  );
};

export default function Page() {
  const audioRef = useRef<HTMLAudioElement>(null);

  const handlePlayAudio = (pokemonName: string) => {
    if (audioRef.current) {
      audioRef.current.src = `mp3/${pokemonName.replace('#', '')}.mp3`;
      audioRef.current.play();
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Pokedex!</h1>
      {pokedex.map((pokemon, index) => (
        <PokemonRow key={index} pokemon={pokemon} audioRef={audioRef} handlePlayAudio={handlePlayAudio} />
      ))}
    </div>
  );
}