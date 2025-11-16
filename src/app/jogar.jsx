import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../services/firebase';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 40, 400);
const CELL_SIZE = BOARD_SIZE / 8;

// Tipos de peças
const PIECE_TYPES = {
  EMPTY: 0,
  PLAYER1: 1,      // Jogador 1 (parte de cima - move para baixo)
  PLAYER1_KING: 2, // Dama do jogador 1
  PLAYER2: 3,      // Jogador 2 (parte de baixo - move para cima) 
  PLAYER2_KING: 4  // Dama do jogador 2
};

export default function JogarScreen() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [board, setBoard] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [possibleMoves, setPossibleMoves] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [skinImageUrl, setSkinImageUrl] = useState(null);

  // Inicializar tabuleiro - CORRIGIDO
  const initializeBoard = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(PIECE_TYPES.EMPTY));
    
    // Colocar peças do jogador 1 (linhas 0, 1, 2 - PARTE SUPERIOR)
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = PIECE_TYPES.PLAYER1;
        }
      }
    }
    
    // Colocar peças do jogador 2 (linhas 5, 6, 7 - PARTE INFERIOR)
    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = PIECE_TYPES.PLAYER2;
        }
      }
    }
    
    setBoard(newBoard);
    setCurrentPlayer(1); // Jogador 1 (peças de cima) sempre começam
    setSelectedPiece(null);
    setPossibleMoves([]);
    setGameOver(false);
    setWinner(null);
  };

  // Verificar se movimento é válido - CORRIGIDO
  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
    if (board[toRow][toCol] !== PIECE_TYPES.EMPTY) return false;
    
    const piece = board[fromRow][fromCol];
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);
    
    // Movimento diagonal obrigatório
    if (colDiff !== Math.abs(rowDiff)) return false;
    
    // Verificar direção baseada no tipo da peça
    if (piece === PIECE_TYPES.PLAYER1) {
      // Jogador 1: peças de cima, só movem PARA BAIXO (rowDiff > 0)
      return rowDiff > 0;
    } else if (piece === PIECE_TYPES.PLAYER2) {
      // Jogador 2: peças de baixo, só movem PARA CIMA (rowDiff < 0) 
      return rowDiff < 0;
    } else if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      // Damas podem mover em qualquer direção
      return true;
    }
    
    return false;
  };

  // Calcular movimentos possíveis - MELHORADO PARA DAMAS
  const calculatePossibleMoves = (row, col) => {
    const moves = [];
    const piece = board[row][col];
    
    // Direções possíveis baseadas no tipo da peça
    let directions = [];
    
    if (piece === PIECE_TYPES.PLAYER1) {
      // Jogador 1 só move para baixo
      directions = [[1, -1], [1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER2) {
      // Jogador 2 só move para cima
      directions = [[-1, -1], [-1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      // Damas movem em todas as direções
      directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }
    
    for (const [dRow, dCol] of directions) {
      if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
        // LÓGICA ESPECIAL PARA DAMAS - podem mover múltiplas casas
        calculateQueenMoves(row, col, dRow, dCol, moves);
      } else {
        // LÓGICA NORMAL PARA PEÇAS SIMPLES
        // Movimento simples (1 casa)
        const newRow = row + dRow;
        const newCol = col + dCol;
        
        if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && 
            board[newRow][newCol] === PIECE_TYPES.EMPTY) {
          moves.push([newRow, newCol]);
        }
        
        // Captura (2 casas)
        const captureRow = row + dRow * 2;
        const captureCol = col + dCol * 2;
        
        if (captureRow >= 0 && captureRow < 8 && captureCol >= 0 && captureCol < 8 && 
            board[captureRow][captureCol] === PIECE_TYPES.EMPTY &&
            canCapture(row, col, captureRow, captureCol)) {
          moves.push([captureRow, captureCol]);
        }
      }
    }
    
    return moves;
  };

  // NOVA FUNÇÃO: Calcular movimentos da dama
  const calculateQueenMoves = (startRow, startCol, dRow, dCol, moves) => {
    const piece = board[startRow][startCol];
    let currentRow = startRow;
    let currentCol = startCol;
    let foundEnemy = false;
    let enemyRow = -1;
    let enemyCol = -1;
    
    // Percorrer a diagonal até encontrar obstáculo ou borda
    for (let step = 1; step < 8; step++) {
      const newRow = startRow + dRow * step;
      const newCol = startCol + dCol * step;
      
      // Verificar se está dentro do tabuleiro
      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) {
        break;
      }
      
      const cellPiece = board[newRow][newCol];
      
      if (cellPiece === PIECE_TYPES.EMPTY) {
        if (!foundEnemy) {
          // Movimento normal - casa vazia sem inimigo no caminho
          moves.push([newRow, newCol]);
        } else {
          // Casa vazia após inimigo - movimento de captura válido
          moves.push([newRow, newCol]);
        }
      } else {
        // Há uma peça nesta casa
        const isEnemyPiece = (
          (piece === PIECE_TYPES.PLAYER1_KING && 
           (cellPiece === PIECE_TYPES.PLAYER2 || cellPiece === PIECE_TYPES.PLAYER2_KING)) ||
          (piece === PIECE_TYPES.PLAYER2_KING && 
           (cellPiece === PIECE_TYPES.PLAYER1 || cellPiece === PIECE_TYPES.PLAYER1_KING))
        );
        
        if (isEnemyPiece && !foundEnemy) {
          // Primeira peça inimiga encontrada
          foundEnemy = true;
          enemyRow = newRow;
          enemyCol = newCol;
        } else {
          // Segunda peça encontrada ou peça aliada - parar
          break;
        }
      }
    }
  };

  // Verificar se há captura - MELHORADO PARA DAMAS
  const canCapture = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    
    // Para damas, usar lógica especial
    if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      return canQueenCapture(fromRow, fromCol, toRow, toCol);
    }
    
    // Para peças normais, lógica original
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Deve ser movimento de 2 casas na diagonal
    if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return false;
    
    const middleRow = fromRow + rowDiff / 2;
    const middleCol = fromCol + colDiff / 2;
    const middlePiece = board[middleRow][middleCol];
    
    // Não pode capturar se casa do meio estiver vazia
    if (middlePiece === PIECE_TYPES.EMPTY) return false;
    
    // Verificar se há peça inimiga no meio
    if (piece === PIECE_TYPES.PLAYER1) {
      return middlePiece === PIECE_TYPES.PLAYER2 || middlePiece === PIECE_TYPES.PLAYER2_KING;
    } else {
      return middlePiece === PIECE_TYPES.PLAYER1 || middlePiece === PIECE_TYPES.PLAYER1_KING;
    }
  };

  // NOVA FUNÇÃO: Verificar captura da dama
  const canQueenCapture = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    // Deve ser movimento diagonal
    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;
    
    const dRow = rowDiff > 0 ? 1 : -1;
    const dCol = colDiff > 0 ? 1 : -1;
    const steps = Math.abs(rowDiff);
    
    let enemyCount = 0;
    let lastEnemyRow = -1;
    let lastEnemyCol = -1;
    
    // Verificar cada casa no caminho
    for (let step = 1; step < steps; step++) {
      const checkRow = fromRow + dRow * step;
      const checkCol = fromCol + dCol * step;
      const checkPiece = board[checkRow][checkCol];
      
      if (checkPiece !== PIECE_TYPES.EMPTY) {
        const isEnemyPiece = (
          (piece === PIECE_TYPES.PLAYER1_KING && 
           (checkPiece === PIECE_TYPES.PLAYER2 || checkPiece === PIECE_TYPES.PLAYER2_KING)) ||
          (piece === PIECE_TYPES.PLAYER2_KING && 
           (checkPiece === PIECE_TYPES.PLAYER1 || checkPiece === PIECE_TYPES.PLAYER1_KING))
        );
        
        if (isEnemyPiece) {
          enemyCount++;
          lastEnemyRow = checkRow;
          lastEnemyCol = checkCol;
        } else {
          // Peça aliada no caminho - não pode capturar
          return false;
        }
      }
    }
    
    // Só pode capturar se houver exatamente 1 inimigo no caminho
    return enemyCount === 1;
  };

  // Mover peça - MELHORADO PARA DAMAS
  const movePiece = (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];
    
    // Mover peça
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = PIECE_TYPES.EMPTY;
    
    // Verificar captura
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    
    if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      // CAPTURA DE DAMA - remover todas as peças inimigas no caminho
      const dRow = rowDiff > 0 ? 1 : -1;
      const dCol = colDiff > 0 ? 1 : -1;
      const steps = Math.abs(rowDiff);
      
      for (let step = 1; step < steps; step++) {
        const checkRow = fromRow + dRow * step;
        const checkCol = fromCol + dCol * step;
        const checkPiece = newBoard[checkRow][checkCol];
        
        if (checkPiece !== PIECE_TYPES.EMPTY) {
          const isEnemyPiece = (
            (piece === PIECE_TYPES.PLAYER1_KING && 
             (checkPiece === PIECE_TYPES.PLAYER2 || checkPiece === PIECE_TYPES.PLAYER2_KING)) ||
            (piece === PIECE_TYPES.PLAYER2_KING && 
             (checkPiece === PIECE_TYPES.PLAYER1 || checkPiece === PIECE_TYPES.PLAYER1_KING))
          );
          
          if (isEnemyPiece) {
            newBoard[checkRow][checkCol] = PIECE_TYPES.EMPTY;
            console.log(`👑💥 Dama capturou peça em [${checkRow}, ${checkCol}]`);
          }
        }
      }
    } else if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      // CAPTURA NORMAL - uma peça apenas
      const middleRow = fromRow + rowDiff / 2;
      const middleCol = fromCol + colDiff / 2;
      newBoard[middleRow][middleCol] = PIECE_TYPES.EMPTY;
      console.log(`💥 Captura! Peça removida em [${middleRow}, ${middleCol}]`);
    }
    
    // Promover para dama
    if (piece === PIECE_TYPES.PLAYER1 && toRow === 7) {
      // Jogador 1 chegou na última linha (linha 7)
      newBoard[toRow][toCol] = PIECE_TYPES.PLAYER1_KING;
      console.log("👑 Jogador 1 promovido a dama!");
    } else if (piece === PIECE_TYPES.PLAYER2 && toRow === 0) {
      // Jogador 2 chegou na primeira linha (linha 0)
      newBoard[toRow][toCol] = PIECE_TYPES.PLAYER2_KING;
      console.log("👑 Jogador 2 promovido a dama!");
    }
    
    setBoard(newBoard);
    setSelectedPiece(null);
    setPossibleMoves([]);
    
    // Trocar jogador
    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);
    
    // Verificar vitória
    checkWinner(newBoard);
  };

  // Verificar vencedor
  const checkWinner = (currentBoard) => {
    const player1Pieces = currentBoard.flat().filter(cell => 
      cell === PIECE_TYPES.PLAYER1 || cell === PIECE_TYPES.PLAYER1_KING
    ).length;
    
    const player2Pieces = currentBoard.flat().filter(cell => 
      cell === PIECE_TYPES.PLAYER2 || cell === PIECE_TYPES.PLAYER2_KING
    ).length;
    
    console.log(`🔍 Contagem de peças: Jogador 1: ${player1Pieces}, Jogador 2: ${player2Pieces}`);
    
    if (player1Pieces === 0) {
      setWinner(2);
      setGameOver(true);
      Alert.alert("🎉 Fim de Jogo!", "Jogador 2 (Azul/Baixo) venceu!");
      console.log("🏆 Jogador 2 venceu!");
    } else if (player2Pieces === 0) {
      setWinner(1);
      setGameOver(true);
      Alert.alert("🎉 Fim de Jogo!", "Jogador 1 (Vermelho/Cima) venceu!");
      console.log("🏆 Jogador 1 venceu!");
    }
  };

  // Lidar com clique na célula
  const handleCellPress = (row, col) => {
    if (gameOver) return;
    
    const piece = board[row][col];
    
    console.log(`🔍 Clique em [${row}, ${col}] - Peça: ${piece} - Jogador atual: ${currentPlayer}`);
    
    // Se não há peça selecionada
    if (!selectedPiece) {
      // Verificar se é peça do jogador atual
      if ((currentPlayer === 1 && (piece === PIECE_TYPES.PLAYER1 || piece === PIECE_TYPES.PLAYER1_KING)) ||
          (currentPlayer === 2 && (piece === PIECE_TYPES.PLAYER2 || piece === PIECE_TYPES.PLAYER2_KING))) {
        setSelectedPiece([row, col]);
        const moves = calculatePossibleMoves(row, col);
        setPossibleMoves(moves);
        console.log(`✅ Peça selecionada [${row}, ${col}] - Movimentos possíveis:`, moves);
      } else {
        console.log(`❌ Peça inválida para jogador ${currentPlayer}`);
      }
    } else {
      // Há peça selecionada
      const [selectedRow, selectedCol] = selectedPiece;
      
      if (row === selectedRow && col === selectedCol) {
        // Desselecionar
        setSelectedPiece(null);
        setPossibleMoves([]);
        console.log("🔄 Peça desselecionada");
      } else if (possibleMoves.some(([r, c]) => r === row && c === col)) {
        // Mover peça
        console.log(`🚀 Movendo de [${selectedRow}, ${selectedCol}] para [${row}, ${col}]`);
        movePiece(selectedRow, selectedCol, row, col);
      } else {
        // Selecionar nova peça (se for do jogador atual)
        if ((currentPlayer === 1 && (piece === PIECE_TYPES.PLAYER1 || piece === PIECE_TYPES.PLAYER1_KING)) ||
            (currentPlayer === 2 && (piece === PIECE_TYPES.PLAYER2 || piece === PIECE_TYPES.PLAYER2_KING))) {
          setSelectedPiece([row, col]);
          const moves = calculatePossibleMoves(row, col);
          setPossibleMoves(moves);
          console.log(`🔄 Nova peça selecionada [${row}, ${col}] - Movimentos:`, moves);
        } else {
          console.log(`❌ Movimento inválido para [${row}, ${col}]`);
        }
      }
    }
  };

  // Renderizar peça com skin
  const renderPiece = (piece) => {
    if (piece === PIECE_TYPES.EMPTY) return null;

    const pieceSize = CELL_SIZE * 0.8;
    
    // Se tem skin customizada
    if (skinImageUrl) {
      switch (piece) {
        case PIECE_TYPES.PLAYER1:
          return (
            <View style={[styles.pieceContainer, { width: pieceSize, height: pieceSize }]}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.skinImage, styles.player1Skin]}
                resizeMode="cover"
              />
            </View>
          );
        case PIECE_TYPES.PLAYER1_KING:
          return (
            <View style={[styles.pieceContainer, { width: pieceSize, height: pieceSize }]}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.skinImage, styles.player1Skin]}
                resizeMode="cover"
              />
              <View style={styles.kingCrown}>
                <Text style={styles.kingText}>♔</Text>
              </View>
            </View>
          );
        case PIECE_TYPES.PLAYER2:
          return (
            <View style={[styles.pieceContainer, { width: pieceSize, height: pieceSize }]}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.skinImage, styles.player2Skin]}
                resizeMode="cover"
              />
            </View>
          );
        case PIECE_TYPES.PLAYER2_KING:
          return (
            <View style={[styles.pieceContainer, { width: pieceSize, height: pieceSize }]}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.skinImage, styles.player2Skin]}
                resizeMode="cover"
              />
              <View style={styles.kingCrown}>
                <Text style={styles.kingText}>♔</Text>
              </View>
            </View>
          );
      }
    } else {
      // Fallback para peças coloridas padrão
      switch (piece) {
        case PIECE_TYPES.PLAYER1:
          return <View style={[styles.defaultPiece, styles.player1Piece, { width: pieceSize, height: pieceSize }]} />;
        case PIECE_TYPES.PLAYER1_KING:
          return (
            <View style={[styles.defaultPiece, styles.player1Piece, { width: pieceSize, height: pieceSize }]}>
              <Text style={styles.kingText}>♔</Text>
            </View>
          );
        case PIECE_TYPES.PLAYER2:
          return <View style={[styles.defaultPiece, styles.player2Piece, { width: pieceSize, height: pieceSize }]} />;
        case PIECE_TYPES.PLAYER2_KING:
          return (
            <View style={[styles.defaultPiece, styles.player2Piece, { width: pieceSize, height: pieceSize }]}>
              <Text style={styles.kingText}>♔</Text>
            </View>
          );
      }
    }
    
    return null;
  };

  // Verificar se célula é movimento possível
  const isPossibleMove = (row, col) => {
    return possibleMoves.some(([r, c]) => r === row && c === col);
  };

  // Verificar se célula está selecionada
  const isSelected = (row, col) => {
    return selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col;
  };

  // useEffects
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);
            
            // Carregar URL da skin
            if (profileData.selectedSkinUrl) {
              setSkinImageUrl(profileData.selectedSkinUrl);
              console.log("🎨 Skin carregada:", profileData.selectedSkinName);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        }
      } else {
        setUserProfile(null);
        setSkinImageUrl(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      initializeBoard();
    }
  }, [user]);

  // Verificar se usuário está logado
  if (!user && !loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loginRequired}>
          <Text style={styles.loginTitle}>🔐 Login Necessário</Text>
          <Text style={styles.loginText}>
            Você precisa estar logado para jogar!
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Fazer Login</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎮 DAMAS</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={initializeBoard}>
          <Text style={styles.resetBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Info do jogador */}
      <View style={styles.playerInfo}>
        <Text style={styles.playerText}>
          Jogando: {userProfile?.username || user?.email?.split('@')[0]}
        </Text>
        {userProfile?.selectedSkinName && (
          <Text style={styles.skinText}>
            🎨 Skin: {userProfile.selectedSkinName}
          </Text>
        )}
        <Text style={styles.currentPlayerText}>
          Vez do: {currentPlayer === 1 ? 'Jogador 1 (Vermelho/Cima)' : 'Jogador 2 (Azul/Baixo)'}
        </Text>
      </View>

      {/* Legendas */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          {skinImageUrl ? (
            <View style={styles.legendPieceContainer}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.legendSkinImage, styles.player1Icon]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.defaultPiece, styles.player1Piece, styles.legendPiece]} />
          )}
          <Text style={styles.legendText}>Jogador 1 (Cima)</Text>
        </View>
        <View style={styles.legendItem}>
          {skinImageUrl ? (
            <View style={styles.legendPieceContainer}>
              <Image
                source={{ uri: skinImageUrl }}
                style={[styles.legendSkinImage, styles.player2Icon]}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={[styles.defaultPiece, styles.player2Piece, styles.legendPiece]} />
          )}
          <Text style={styles.legendText}>Jogador 2 (Baixo)</Text>
        </View>
      </View>

      {/* Tabuleiro */}
      <View style={styles.board}>
        {board.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => {
              const isBlack = (rowIndex + colIndex) % 2 === 1;
              const selected = isSelected(rowIndex, colIndex);
              const possibleMove = isPossibleMove(rowIndex, colIndex);
              
              return (
                <TouchableOpacity
                  key={`${rowIndex}-${colIndex}`}
                  style={[
                    styles.cell,
                    isBlack ? styles.blackCell : styles.whiteCell,
                    selected && styles.selectedCell,
                    possibleMove && styles.possibleMoveCell
                  ]}
                  onPress={() => handleCellPress(rowIndex, colIndex)}
                  disabled={!isBlack}
                >
                  {renderPiece(cell)}
                  {possibleMove && <View style={styles.possibleMoveIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Status do jogo */}
      <View style={styles.gameStatus}>
        {gameOver ? (
          <Text style={styles.gameOverText}>
            🏆 Jogo Terminado! Vencedor: Jogador {winner}
          </Text>
        ) : (
          <Text style={styles.statusText}>
            {selectedPiece ? 'Clique onde deseja mover' : 'Selecione uma peça para mover'}
          </Text>
        )}
      </View>
    </View>
  );
}

// Os estilos permanecem iguais...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  loginRequired: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 30,
    borderRadius: 20,
    margin: 20,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 30,
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#666',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backBtn: {
    backgroundColor: '#666',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  backBtnText: {
    color: '#fff',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  resetBtn: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  resetBtnText: {
    fontSize: 16,
  },
  playerInfo: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  playerText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  skinText: {
    color: '#FF9800',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 5,
  },
  currentPlayerText: {
    color: '#FFA726',
    fontSize: 14,
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 12,
  },
  legendPieceContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  legendSkinImage: {
    width: '100%',
    height: '100%',
  },
  legendPiece: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  board: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  blackCell: {
    backgroundColor: '#8B4513',
  },
  whiteCell: {
    backgroundColor: '#F5DEB3',
  },
  selectedCell: {
    backgroundColor: '#FFD700',
  },
  possibleMoveCell: {
    backgroundColor: '#90EE90',
  },
  
  // Estilos das peças com skin
  pieceContainer: {
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  skinImage: {
    width: '180%',
    height: '200%',
  },
  player1Skin: {
    // Mostra a metade esquerda da imagem
    transform: [{ scaleX: 2 }, { translateX: '18%' }, { translateY: '-25%'}],
  },
  player2Skin: {
    // Mostra a metade direita da imagem
    transform: [{ scaleX: 2 }, { translateX: '-38%' }, { translateY: '-25%'}],
  },
  player1Icon: {
    // Ícone para legenda - metade esquerda
    transform: [{ scaleX: 2 }, { translateX: '25%' }],
  },
  player2Icon: {
    // Ícone para legenda - metade direita
    transform: [{ scaleX: 2 }, { translateX: '-25%' }],
  },
  kingCrown: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFD700',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kingText: {
    color: '#B8860B',
    fontSize: 10,
    fontWeight: 'bold',
  },
  
  // Peças padrão (fallback)
  defaultPiece: {
    borderRadius: 50,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  player1Piece: {
    backgroundColor: '#FF4444',
    borderColor: '#AA0000',
  },
  player2Piece: {
    backgroundColor: '#4444FF',
    borderColor: '#0000AA',
  },
  
  possibleMoveIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00FF00',
  },
  gameStatus: {
    backgroundColor: '#1a1a1a',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  gameOverText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});