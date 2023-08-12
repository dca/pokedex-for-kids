"use client"
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Home() {

  const { replace } = useRouter();

  useEffect(() => {
    replace('/pokedex-kids');
  }, [replace]);

  return <p>Redirecting...</p>;
}
