import { useRouter } from "expo-router";
import React from "react";

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
  btnLogin: {
    display: 'block',
    width: '200px',
    padding: '15px',
    margin: '25px auto 0 auto',
    fontSize: '18px',
    fontWeight: 'bold',
    background: '#4CAF50',
    color: 'white',
    border: '3px solid #4CAF50',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textDecoration: 'none',
    lineHeight: 1,
  },
  divider: {
    height: '1px',
    background: '#ddd',
    margin: '20px 0',
  },
};

const menuItems = [
  { label: 'JOGAR', href: '/jogar' },
  { label: 'SKINS', href: '/skins' },
  { label: 'RANKING', href: '/ranking' },
  { label: 'CONFIGURAÇÕES', href: '/configuracoes' },
  { label: 'CRÉDITOS', href: '/creditos' },
];

export default function DamiumMenu() {
  const router = useRouter();

  return (
    <div style={styles.body}>
      <div style={styles.menuContainer}>
        <h1 style={styles.h1}>DAMIUN</h1>
        {menuItems.map(item => (
          <button
            key={item.label}
            style={styles.btn}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </button>
        ))}

        <div style={styles.divider}></div>

        <button style={styles.btnLogin} onClick={() => router.push('/login')}>
           LOGIN
         </button> 
      </div>
    </div>
  );
}