import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
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

const PIECE_TYPES = {
  EMPTY: 0,
  PLAYER1: 1,
  PLAYER1_KING: 2,
  PLAYER2: 3,
  PLAYER2_KING: 4
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

  const rankingUpdatedRef = useRef(false);

  const initializeBoard = () => {
    const newBoard = Array(8).fill(null).map(() => Array(8).fill(PIECE_TYPES.EMPTY));

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = PIECE_TYPES.PLAYER1;
        }
      }
    }

    for (let row = 5; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if ((row + col) % 2 === 1) {
          newBoard[row][col] = PIECE_TYPES.PLAYER2;
        }
      }
    }

    setBoard(newBoard);
    setCurrentPlayer(1);
    setSelectedPiece(null);
    setPossibleMoves([]);
    setGameOver(false);
    setWinner(null);

    rankingUpdatedRef.current = false;
  };

  const updatePlayer1Ranking = async (winnerPlayer) => {
    if (!user) return;

    const delta = winnerPlayer === 1 ? 3 : -3;
    const matches = 1;

    const username =
      userProfile?.username ||
      user?.email?.split('@')?.[0] ||
      'player';

    const rankingRef = doc(db, 'rankings', user.uid);

    await setDoc(
      rankingRef,
      {
        uid: user.uid,
        username,
        points: increment(delta),
        matches: increment(matches),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  };

  const isValidMove = (fromRow, fromCol, toRow, toCol) => {
    if (toRow < 0 || toRow >= 8 || toCol < 0 || toCol >= 8) return false;
    if (board[toRow][toCol] !== PIECE_TYPES.EMPTY) return false;

    const piece = board[fromRow][fromCol];
    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    if (colDiff !== Math.abs(rowDiff)) return false;

    if (piece === PIECE_TYPES.PLAYER1) {
      return rowDiff > 0;
    } else if (piece === PIECE_TYPES.PLAYER2) {
      return rowDiff < 0;
    } else if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      return true;
    }

    return false;
  };

  const getMandatoryCaptures = (row, col) => {
    const captures = [];
    const piece = board[row][col];

    let directions = [];

    if (piece === PIECE_TYPES.PLAYER1) {
      directions = [[1, -1], [1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER2) {
      directions = [[-1, -1], [-1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }

    for (const [dRow, dCol] of directions) {
      if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
        for (let step = 2; step < 8; step++) {
          const toRow = row + dRow * step;
          const toCol = col + dCol * step;

          if (
            toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 &&
            board[toRow][toCol] === PIECE_TYPES.EMPTY &&
            canQueenCapture(row, col, toRow, toCol)
          ) {
            captures.push([toRow, toCol]);
          }
        }
      } else {
        const toRow = row + dRow * 2;
        const toCol = col + dCol * 2;

        if (
          toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 &&
          board[toRow][toCol] === PIECE_TYPES.EMPTY &&
          canCapture(row, col, toRow, toCol)
        ) {
          captures.push([toRow, toCol]);
        }
      }
    }

    return captures;
  };

  const hasObligatoryCaptures = (player) => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];

        const isPlayerPiece = (
          (player === 1 && (piece === PIECE_TYPES.PLAYER1 || piece === PIECE_TYPES.PLAYER1_KING)) ||
          (player === 2 && (piece === PIECE_TYPES.PLAYER2 || piece === PIECE_TYPES.PLAYER2_KING))
        );

        if (isPlayerPiece) {
          const captures = getMandatoryCaptures(row, col);
          if (captures.length > 0) return true;
        }
      }
    }
    return false;
  };

  const calculatePossibleMoves = (row, col) => {
    const piece = board[row][col];

    const captures = getMandatoryCaptures(row, col);

    if (captures.length > 0) {
      console.log(`🔥 Capturas obrigatórias encontradas para [${row}, ${col}]:`, captures);
      return captures;
    }

    const playerPieceType = piece === PIECE_TYPES.PLAYER1 || piece === PIECE_TYPES.PLAYER1_KING ? 1 : 2;
    if (hasObligatoryCaptures(playerPieceType)) {
      console.log(`⚠️ Outras peças têm capturas obrigatórias. Peça [${row}, ${col}] não pode se mover.`);
      return [];
    }

    const moves = [];
    let directions = [];

    if (piece === PIECE_TYPES.PLAYER1) {
      directions = [[1, -1], [1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER2) {
      directions = [[-1, -1], [-1, 1]];
    } else if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    }

    for (const [dRow, dCol] of directions) {
      if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
        calculateQueenMoves(row, col, dRow, dCol, moves);
      } else {
        const newRow = row + dRow;
        const newCol = col + dCol;

        if (
          newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 &&
          board[newRow][newCol] === PIECE_TYPES.EMPTY
        ) {
          moves.push([newRow, newCol]);
        }
      }
    }

    return moves;
  };

  const calculateQueenMoves = (startRow, startCol, dRow, dCol, moves) => {
    const piece = board[startRow][startCol];
    let foundEnemy = false;

    for (let step = 1; step < 8; step++) {
      const newRow = startRow + dRow * step;
      const newCol = startCol + dCol * step;

      if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

      const cellPiece = board[newRow][newCol];

      if (cellPiece === PIECE_TYPES.EMPTY) {
        moves.push([newRow, newCol]);
      } else {
        const isEnemyPiece = (
          (piece === PIECE_TYPES.PLAYER1_KING &&
            (cellPiece === PIECE_TYPES.PLAYER2 || cellPiece === PIECE_TYPES.PLAYER2_KING)) ||
          (piece === PIECE_TYPES.PLAYER2_KING &&
            (cellPiece === PIECE_TYPES.PLAYER1 || cellPiece === PIECE_TYPES.PLAYER1_KING))
        );

        if (isEnemyPiece && !foundEnemy) {
          foundEnemy = true;
        } else {
          break;
        }
      }
    }
  };

  const canCapture = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];

    if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
      return canQueenCapture(fromRow, fromCol, toRow, toCol);
    }

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(rowDiff) !== 2 || Math.abs(colDiff) !== 2) return false;

    const middleRow = fromRow + rowDiff / 2;
    const middleCol = fromCol + colDiff / 2;
    const middlePiece = board[middleRow][middleCol];

    if (middlePiece === PIECE_TYPES.EMPTY) return false;

    if (piece === PIECE_TYPES.PLAYER1) {
      return middlePiece === PIECE_TYPES.PLAYER2 || middlePiece === PIECE_TYPES.PLAYER2_KING;
    } else {
      return middlePiece === PIECE_TYPES.PLAYER1 || middlePiece === PIECE_TYPES.PLAYER1_KING;
    }
  };

  const canQueenCapture = (fromRow, fromCol, toRow, toCol) => {
    const piece = board[fromRow][fromCol];
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;

    if (Math.abs(rowDiff) !== Math.abs(colDiff)) return false;

    const dRow = rowDiff > 0 ? 1 : -1;
    const dCol = colDiff > 0 ? 1 : -1;
    const steps = Math.abs(rowDiff);

    let enemyCount = 0;

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
        } else {
          return false;
        }
      }
    }

    return enemyCount === 1;
  };

  const movePiece = async (fromRow, fromCol, toRow, toCol) => {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[fromRow][fromCol];

    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = PIECE_TYPES.EMPTY;

    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    let captureOccurred = false;

    if (piece === PIECE_TYPES.PLAYER1_KING || piece === PIECE_TYPES.PLAYER2_KING) {
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
            captureOccurred = true;
            console.log(`👑💥 Dama capturou peça em [${checkRow}, ${checkCol}]`);
          }
        }
      }
    } else if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
      const middleRow = fromRow + rowDiff / 2;
      const middleCol = fromCol + colDiff / 2;
      newBoard[middleRow][middleCol] = PIECE_TYPES.EMPTY;
      captureOccurred = true;
      console.log(`💥 Captura! Peça removida em [${middleRow}, ${middleCol}]`);
    }

    let promoted = false;
    if (piece === PIECE_TYPES.PLAYER1 && toRow === 7) {
      newBoard[toRow][toCol] = PIECE_TYPES.PLAYER1_KING;
      promoted = true;
      console.log("👑 Jogador 1 promovido a dama!");
    } else if (piece === PIECE_TYPES.PLAYER2 && toRow === 0) {
      newBoard[toRow][toCol] = PIECE_TYPES.PLAYER2_KING;
      promoted = true;
      console.log("👑 Jogador 2 promovido a dama!");
    }

    setBoard(newBoard);

    if (captureOccurred && !promoted) {
      const additionalCaptures = [];
      const currentPiece = newBoard[toRow][toCol];

      let directions = [];

      if (currentPiece === PIECE_TYPES.PLAYER1) {
        directions = [[1, -1], [1, 1]];
      } else if (currentPiece === PIECE_TYPES.PLAYER2) {
        directions = [[-1, -1], [-1, 1]];
      } else if (currentPiece === PIECE_TYPES.PLAYER1_KING || currentPiece === PIECE_TYPES.PLAYER2_KING) {
        directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
      }

      for (const [dRow, dCol] of directions) {
        if (currentPiece === PIECE_TYPES.PLAYER1_KING || currentPiece === PIECE_TYPES.PLAYER2_KING) {
          for (let step = 2; step < 8; step++) {
            const nextRow = toRow + dRow * step;
            const nextCol = toCol + dCol * step;

            if (
              nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 &&
              newBoard[nextRow][nextCol] === PIECE_TYPES.EMPTY
            ) {
              let enemyCount = 0;

              for (let checkStep = 1; checkStep < step; checkStep++) {
                const checkRow = toRow + dRow * checkStep;
                const checkCol = toCol + dCol * checkStep;
                const checkPiece = newBoard[checkRow][checkCol];

                if (checkPiece !== PIECE_TYPES.EMPTY) {
                  const isEnemyPiece = (
                    (currentPiece === PIECE_TYPES.PLAYER1_KING &&
                      (checkPiece === PIECE_TYPES.PLAYER2 || checkPiece === PIECE_TYPES.PLAYER2_KING)) ||
                    (currentPiece === PIECE_TYPES.PLAYER2_KING &&
                      (checkPiece === PIECE_TYPES.PLAYER1 || checkPiece === PIECE_TYPES.PLAYER1_KING))
                  );

                  if (isEnemyPiece) {
                    enemyCount++;
                  } else {
                    break;
                  }
                }
              }

              if (enemyCount === 1) {
                additionalCaptures.push([nextRow, nextCol]);
              }
            }
          }
        } else {
          const nextRow = toRow + dRow * 2;
          const nextCol = toCol + dCol * 2;

          if (
            nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 &&
            newBoard[nextRow][nextCol] === PIECE_TYPES.EMPTY
          ) {
            const middleRow = toRow + dRow;
            const middleCol = toCol + dCol;
            const middlePiece = newBoard[middleRow][middleCol];

            if (middlePiece !== PIECE_TYPES.EMPTY) {
              const isEnemyPiece = (
                (currentPiece === PIECE_TYPES.PLAYER1 &&
                  (middlePiece === PIECE_TYPES.PLAYER2 || middlePiece === PIECE_TYPES.PLAYER2_KING)) ||
                (currentPiece === PIECE_TYPES.PLAYER2 &&
                  (middlePiece === PIECE_TYPES.PLAYER1 || middlePiece === PIECE_TYPES.PLAYER1_KING))
              );

              if (isEnemyPiece) {
                additionalCaptures.push([nextRow, nextCol]);
              }
            }
          }
        }
      }

      if (additionalCaptures.length > 0) {
        console.log(`🔥 Capturas adicionais disponíveis:`, additionalCaptures);
        setSelectedPiece([toRow, toCol]);
        setPossibleMoves(additionalCaptures);
        return;
      }
    }

    setSelectedPiece(null);
    setPossibleMoves([]);

    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    setCurrentPlayer(nextPlayer);

    await checkWinner(newBoard);
  };

  const checkWinner = async (currentBoard) => {
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

      if (!rankingUpdatedRef.current) {
        rankingUpdatedRef.current = true;
        try {
          await updatePlayer1Ranking(2); // player 1 perdeu => -3
        } catch (e) {
          console.error("Erro ao atualizar ranking:", e);
          Alert.alert("Ranking", "Não foi possível atualizar o ranking agora.");
        }
      }

    } else if (player2Pieces === 0) {
      setWinner(1);
      setGameOver(true);
      Alert.alert("🎉 Fim de Jogo!", "Jogador 1 (Vermelho/Cima) venceu!");
      console.log("🏆 Jogador 1 venceu!");

      if (!rankingUpdatedRef.current) {
        rankingUpdatedRef.current = true;
        try {
          await updatePlayer1Ranking(1); // player 1 ganhou => +3
        } catch (e) {
          console.error("Erro ao atualizar ranking:", e);
          Alert.alert("Ranking", "Não foi possível atualizar o ranking agora.");
        }
      }
    }
  };

  const handleCellPress = (row, col) => {
    if (gameOver) return;

    const piece = board[row][col];

    console.log(`🔍 Clique em [${row}, ${col}] - Peça: ${piece} - Jogador atual: ${currentPlayer}`);

    if (!selectedPiece) {
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
      const [selectedRow, selectedCol] = selectedPiece;

      if (row === selectedRow && col === selectedCol) {
        setSelectedPiece(null);
        setPossibleMoves([]);
        console.log("🔄 Peça desselecionada");
      } else if (possibleMoves.some(([r, c]) => r === row && c === col)) {
        console.log(`🚀 Movendo de [${selectedRow}, ${selectedCol}] para [${row}, ${col}]`);
        movePiece(selectedRow, selectedCol, row, col);
      } else {
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

  const renderPiece = (piece) => {
    if (piece === PIECE_TYPES.EMPTY) return null;

    const pieceSize = CELL_SIZE * 0.8;

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

  const isPossibleMove = (row, col) => {
    return possibleMoves.some(([r, c]) => r === row && c === col);
  };

  const isSelected = (row, col) => {
    return selectedPiece && selectedPiece[0] === row && selectedPiece[1] === col;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data();
            setUserProfile(profileData);

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
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>🎮 DAMAS</Text>
        <TouchableOpacity style={styles.resetBtn} onPress={initializeBoard}>
          <Text style={styles.resetBtnText}>🔄</Text>
        </TouchableOpacity>
      </View>

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
    transform: [{ scaleX: 2 }, { translateX: '18%' }, { translateY: '-25%'}],
  },
  player2Skin: {
    transform: [{ scaleX: 2 }, { translateX: '-38%' }, { translateY: '-25%'}],
  },
  player1Icon: {
    transform: [{ scaleX: 2 }, { translateX: '25%' }],
  },
  player2Icon: {
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
