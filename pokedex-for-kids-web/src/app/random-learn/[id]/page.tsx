'use client';
import React, { useRef } from 'react';
import Image from 'next/image'
import pokedex from '@/app/data/base-pokedex.json';
import { styles } from '../styles';
import { MainClient } from 'pokenode-ts';

interface PokemonRowProps {
  pokemon: {
    'index': string;
    'name-tw': string;
    'name-en': string;
  };
  audioRef: React.RefObject<HTMLAudioElement>;
  handlePlayAudio: (pokemonName: string) => void;
}

export default async function Page({ params }: { params: { id: string } }) {

  // random pokemon
  const idNum = Number.parseInt(params.id)
  const randomPokemon = pokedex[idNum + 1];

  const api = new MainClient();

  const pokemon = await api.pokemon.getPokemonById(idNum)
  const pokemonAbility = await api.pokemon.getAbilityById(idNum)

  console.log('pokemon', pokemon, pokemonAbility)

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Pokedex!</h1>
      randomPokemon {randomPokemon['name-tw']}
    </div>
  );
}