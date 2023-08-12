
import React from 'react';
import pokedex from '@/app/data/base-pokedex.json';

type Params = {
  name: string
}

export default function Page({ params }: { params: { name: string } }) {
  return (
    <div>Pokedex!</div>
  );
}

export function generateStaticParams() {
  return pokedex.map(p => ({ name: p['name-en'] }))
}
