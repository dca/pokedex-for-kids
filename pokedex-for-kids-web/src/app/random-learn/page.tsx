'use client';
import React, { useRef } from 'react';
import Image from 'next/image'
import pokedex from '@/app/data/base-pokedex.json';
import { styles } from './styles';
import { redirect } from 'next/navigation';

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
      {/* <img 
        style={styles.pokemonImage}
        src={`https://assets.pokemon.com/assets/cms2/img/pokedex/full/${(pokemon['index'].replace('#0', '#').replace('#', ''))}.png`} 
        alt={pokemon['name-en']} 
      /> */}
      <Image 
        style={styles.pokemonImage}
        width={100}
        height={100}
        loading="lazy"
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

  // random pokemon
  const randomPokemon = pokedex[Math.floor(Math.random() * pokedex.length)];

  redirect(`/pokedex-for-kids/random-learn/${randomPokemon.index.replace('#', '')}`)
}