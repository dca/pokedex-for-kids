'use client';
import React from 'react';

// 添加CSS動畫
const titleStyles = `
  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes backgroundShift {
    0% {
      background-position: 0% 50%;
    }
    25% {
      background-position: 50% 0%;
    }
    50% {
      background-position: 100% 50%;
    }
    75% {
      background-position: 50% 100%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
  
  @keyframes imageGlow {
    0% {
      background-position: 0% 50%;
      filter: drop-shadow(0 0 5px rgba(255,215,0,0.3));
    }
    50% {
      background-position: 100% 50%;
      filter: drop-shadow(0 0 15px rgba(255,107,107,0.4));
    }
    100% {
      background-position: 0% 50%;
      filter: drop-shadow(0 0 5px rgba(255,215,0,0.3));
    }
  }
  
  @keyframes playingPulse {
    0% {
      box-shadow: 0px 20px 40px rgba(76, 175, 80, 0.4), 0px 0px 20px rgba(76, 175, 80, 0.3);
    }
    50% {
      box-shadow: 0px 25px 50px rgba(76, 175, 80, 0.6), 0px 0px 30px rgba(76, 175, 80, 0.5);
    }
    100% {
      box-shadow: 0px 20px 40px rgba(76, 175, 80, 0.4), 0px 0px 20px rgba(76, 175, 80, 0.3);
    }
  }
`;

// 將動畫樣式注入到頁面
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = titleStyles;
  document.head.appendChild(styleSheet);
}

export const styles: { [key: string]: React.CSSProperties; } = {
  container: {
    fontFamily: "'Arial', sans-serif",
    background: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 25%, #45B7D1 50%, #96CEB4 75%, #FFEAA7 100%)',
    backgroundSize: '400% 400%',
    animation: 'backgroundShift 8s ease-in-out infinite',
    minHeight: '100vh',
    padding: '40px 20px 20px 20px',
    paddingTop: '0',
    backgroundAttachment: 'fixed'
  },
  title: {
    fontSize: '48px',
    margin: '0',
    textAlign: 'center',
    fontWeight: '800',
    color: '#333',
    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
    letterSpacing: '2px',
    position: 'relative',
    zIndex: 1
  },
  titleContainer: {
    position: 'relative',
    display: 'inline-block',
    width: '100%',
    marginBottom: '30px',
    marginTop: '40px',
    padding: '30px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '30px',
    backdropFilter: 'blur(20px)',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1), inset 0 2px 0 rgba(255, 255, 255, 0.5)'
  },
  titleGlow: {
    position: 'absolute',
    top: '25px',
    left: '0',
    right: '0',
    fontSize: '48px',
    fontWeight: '800',
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    filter: 'blur(20px)',
    zIndex: 0,
    letterSpacing: '2px'
  },
  pokemonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px'
  },
  pokemonCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '24px',
    border: '3px solid transparent',
    background: 'linear-gradient(white, white) padding-box, linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4) border-box',
    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.15), 0px 4px 15px rgba(255, 107, 107, 0.2)',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden'
  },
  pokemonCardPlaying: {
    background: 'linear-gradient(#e8f5e8, #e8f5e8) padding-box, linear-gradient(45deg, #4CAF50, #81C784, #A5D6A7) border-box',
    transform: 'translateY(-12px) scale(1.05)',
    boxShadow: '0px 20px 40px rgba(76, 175, 80, 0.4), 0px 0px 20px rgba(76, 175, 80, 0.3)',
    animation: 'playingPulse 1.5s ease-in-out infinite'
  },
  pokemonCardLoading: {
    background: 'linear-gradient(#f0f8ff, #f0f8ff) padding-box, linear-gradient(45deg, #2196F3, #64B5F6, #90CAF9) border-box',
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0px 15px 35px rgba(33, 150, 243, 0.4), 0px 0px 15px rgba(33, 150, 243, 0.2)'
  },
  pokemonImageContainer: {
    position: 'relative',
    marginBottom: '16px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 25%, #FF6B6B 50%, #4ECDC4 75%, #45B7D1 100%)',
    backgroundSize: '200% 200%',
    animation: 'imageGlow 3s ease-in-out infinite',
    padding: '4px',
    width: '128px',
    height: '128px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  pokemonImage: {
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '12px',
    boxShadow: '0 0 20px rgba(255,255,255,0.8), inset 0 0 10px rgba(0,0,0,0.1)'
  },
  pokemonInfo: {
    textAlign: 'center',
    width: '100%'
  },
  pokemonIndex: {
    fontSize: '14px',
    color: '#666',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  pokemonNameTw: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '4px'
  },
  pokemonNameEn: {
    fontSize: '16px',
    color: '#666',
    fontStyle: 'italic',
    marginBottom: '8px'
  },
  pokemonStatus: {
    fontSize: '24px',
    marginTop: '8px',
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  controlPanel: {
    position: 'sticky',
    top: '20px',
    zIndex: 1000,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: '16px',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    margin: '0 auto 20px auto',
    maxWidth: '400px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  errorMessage: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '16px',
    borderRadius: '12px',
    margin: '20px auto',
    maxWidth: '600px',
    border: '1px solid #ffcdd2',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  }
};
