import { useRouter } from "expo-router";
import React from "react";

const styles = {
  body: {
    margin: 0,
    padding: 0,
    background: '#0a0a0a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '60px 50px',
    borderRadius: '24px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    maxWidth: '320px',
  },
  h1: {
    fontSize: '42px',
    margin: '0 0 50px 0',
    color: '#fff',
    fontWeight: '300',
    letterSpacing: '8px',
  },
  btn: {
    display: 'block',
    width: '100%',
    padding: '14px',
    margin: '10px 0',
    fontSize: '15px',
    fontWeight: '400',
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    lineHeight: 1,
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  btnHover: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
    transform: 'translateY(-2px)',
  },
  btnLogin: {
    display: 'block',
    width: '100%',
    padding: '14px',
    margin: '30px 0 0 0',
    fontSize: '15px',
    fontWeight: '500',
    background: '#fff',
    color: '#0a0a0a',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textDecoration: 'none',
    lineHeight: 1,
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  btnLoginHover: {
    background: '#f0f0f0',
    transform: 'translateY(-2px)',
  },
  divider: {
    height: '1px',
    background: 'rgba(255, 255, 255, 0.08)',
    margin: '30px 0 0 0',
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
  const [hoveredBtn, setHoveredBtn] = React.useState(null);
  const [hoveredLogin, setHoveredLogin] = React.useState(false);

  return (
    <div style={styles.body}>
      <div style={styles.menuContainer}>
        <h1 style={styles.h1}>DAMIUM</h1>
        {menuItems.map((item, index) => (
          <button
            key={item.label}
            style={{
              ...styles.btn,
              ...(hoveredBtn === index ? styles.btnHover : {}),
            }}
            onMouseEnter={() => setHoveredBtn(index)}
            onMouseLeave={() => setHoveredBtn(null)}
            onClick={() => router.push(item.href)}
          >
            {item.label}
          </button>
        ))}
        <div style={styles.divider}></div>
        <button
          style={{
            ...styles.btnLogin,
            ...(hoveredLogin ? styles.btnLoginHover : {}),
          }}
          onMouseEnter={() => setHoveredLogin(true)}
          onMouseLeave={() => setHoveredLogin(false)}
          onClick={() => router.push('/login')}
        >
          LOGIN
        </button>
      </div>
    </div>
  );
}