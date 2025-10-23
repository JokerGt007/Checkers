import { useRouter } from "expo-router";
import { useState } from "react";

const styles = {
  body: {
    margin: 0,
    padding: 0,
    background: '#0a0a0a',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px 20px',
  },
  container: {
    maxWidth: '900px',
    width: '100%',
  },
  header: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  title: {
    fontSize: '42px',
    margin: '0 0 10px 0',
    color: '#fff',
    fontWeight: '300',
    letterSpacing: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '300',
    letterSpacing: '2px',
  },
  skinsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px',
  },
  skinCard: {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '30px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  skinCardHover: {
    background: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: 'translateY(-4px)',
  },
  skinCardSelected: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#fff',
  },
  skinIcon: {
    fontSize: '64px',
    marginBottom: '20px',
  },
  skinImage: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    marginBottom: '20px',
  },
  skinName: {
    fontSize: '18px',
    color: '#fff',
    fontWeight: '400',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  skinStatus: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '1px',
  },
  lockedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: '1px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    marginTop: '40px',
  },
  btnBack: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '400',
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  btnBackHover: {
    background: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  btnConfirm: {
    padding: '14px 32px',
    fontSize: '15px',
    fontWeight: '500',
    background: '#fff',
    color: '#0a0a0a',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    borderRadius: '8px',
    letterSpacing: '1px',
  },
  btnConfirmHover: {
    background: '#f0f0f0',
    transform: 'translateY(-2px)',
  },
  selectedIndicator: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
  },
};

const skins = [
  { id: 1, name: 'CORINGA', image: '/assets/parts/SKINS/coringa.png', unlocked: true },
  { id: 2, name: 'GUNDAM', image: '/assets/parts/SKINS/gundam.png', unlocked: true },
  { id: 3, name: 'EM BREVE', icon: '❓', unlocked: false },
  { id: 4, name: 'EM BREVE', icon: '❓', unlocked: false },
  { id: 5, name: 'EM BREVE', icon: '❓', unlocked: false },
];

export default function SkinsMenu() {
  const router = useRouter();
  const [selectedSkin, setSelectedSkin] = useState(1);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [hoveredBack, setHoveredBack] = useState(false);
  const [hoveredConfirm, setHoveredConfirm] = useState(false);

  const handleSkinSelect = (skinId, unlocked) => {
    if (unlocked) {
      setSelectedSkin(skinId);
    }
  };

  const handleConfirm = () => {
    console.log('Skin selecionada:', selectedSkin);
    router.push('/');
  };

  return (
    <div style={styles.body}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>SKINS</h1>
          <p style={styles.subtitle}>ESCOLHA SUA APARÊNCIA</p>
        </div>

        <div style={styles.skinsGrid}>
          {skins.map((skin) => (
            <div
              key={skin.id}
              style={{
                ...styles.skinCard,
                ...(hoveredCard === skin.id && skin.unlocked ? styles.skinCardHover : {}),
                ...(selectedSkin === skin.id ? styles.skinCardSelected : {}),
              }}
              onMouseEnter={() => setHoveredCard(skin.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => handleSkinSelect(skin.id, skin.unlocked)}
            >
              {selectedSkin === skin.id && skin.unlocked && (
                <div style={styles.selectedIndicator}>✓</div>
              )}
              
              {skin.image ? (
                <img src={skin.image} alt={skin.name} style={styles.skinImage} />
              ) : (
                <div style={styles.skinIcon}>{skin.icon}</div>
              )}
              
              <div style={styles.skinName}>{skin.name}</div>
              <div style={styles.skinStatus}>
                {skin.unlocked ? 'DISPONÍVEL' : 'BLOQUEADO'}
              </div>

              {!skin.unlocked && (
                <div style={styles.lockedOverlay}>
                  🔒 BLOQUEADO
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={styles.buttonContainer}>
          <button
            style={{
              ...styles.btnBack,
              ...(hoveredBack ? styles.btnBackHover : {}),
            }}
            onMouseEnter={() => setHoveredBack(true)}
            onMouseLeave={() => setHoveredBack(false)}
            onClick={() => router.push('/')}
          >
            VOLTAR
          </button>
          <button
            style={{
              ...styles.btnConfirm,
              ...(hoveredConfirm ? styles.btnConfirmHover : {}),
            }}
            onMouseEnter={() => setHoveredConfirm(true)}
            onMouseLeave={() => setHoveredConfirm(false)}
            onClick={handleConfirm}
          >
            CONFIRMAR
          </button>
        </div>
      </div>
    </div>
  );
}