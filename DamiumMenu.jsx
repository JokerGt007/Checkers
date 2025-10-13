import React from 'react';

// CSS em estilo de objeto JS
const styles = {
  body: {
    margin: 0,
    padding: 0,
    background: 'linear-gradient(135deg, #1a1a1a 0%, #333 100%)',
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    textAlign: 'center',
    background: 'white',
    padding: '50px 60px',
    borderRadius: '15px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
  },
  h1: {
    fontSize: '48px',
    margin: '0 0 40px 0',
    color: '#222',
    letterSpacing: '3px',
  },
  btn: {
    display: 'block',
    width: '200px',
    padding: '15px',
    margin: '15px auto',
    fontSize: '18px',
    fontWeight: 'bold',
    background: '#000',
    color: 'white',
    border: '3px solid #000',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textDecoration: 'none',
    lineHeight: 1,
  },
};

const menuItems = [
  { label: 'JOGAR', href: 'jogar.html' },
  { label: 'SKINS', href: 'skins.html' },
  { label: 'RANKING', href: 'ranking.html' },
  { label: 'CONFIGURAÇÕES', href: 'configuracoes.html' },
  { label: 'CRÉDITOS', href: 'creditos.html' },
];

export default function DamiumMenu() {
  return (
    <div style={styles.body}>
      <div style={styles.menuContainer}>
        <h1 style={styles.h1}>DAMIUN</h1>
        {menuItems.map(item => (
          <a
            key={item.label}
            href={item.href}
            style={styles.btn}
            onMouseOver={e => {
              e.target.style.background = 'white';
              e.target.style.color = '#000';
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
            }}
            onMouseOut={e => {
              e.target.style.background = '#000';
              e.target.style.color = 'white';
              e.target.style.transform = 'none';
              e.target.style.boxShadow = 'none';
            }}
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}