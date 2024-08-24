'use client';
import React from 'react';

export const styles: { [key: string]: React.CSSProperties; } = {
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
    flex: 1,
    fontSize: '18px',
    marginRight: '20px'
  },
  pokemonImage: {
    // width: '100px',
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
