<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Damium</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        
        .login-container {
            background: white;
            padding: 40px 50px;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            width: 350px;
        }
        
        h1 {
            font-size: 36px;
            margin: 0 0 30px 0;
            color: #222;
            text-align: center;
            letter-spacing: 2px;
        }
        
        .input-group {
            margin-bottom: 20px;
        }
        
        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: bold;
            font-size: 14px;
        }
        
        input[type="text"],
        input[type="password"] {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            font-size: 16px;
            box-sizing: border-box;
            transition: border-color 0.3s;
        }
        
        input[type="text"]:focus,
        input[type="password"]:focus {
            outline: none;
            border-color: #000;
        }
        
        .btn-login {
            width: 100%;
            padding: 15px;
            margin-top: 10px;
            font-size: 18px;
            font-weight: bold;
            background: #000;
            color: white;
            border: 3px solid #000;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .btn-login:hover {
            background: white;
            color: #000;
        }
        
        .divider {
            text-align: center;
            margin: 25px 0;
            color: #666;
            position: relative;
        }
        
        .divider::before,
        .divider::after {
            content: '';
            position: absolute;
            top: 50%;
            width: 40%;
            height: 1px;
            background: #ddd;
        }
        
        .divider::before {
            left: 0;
        }
        
        .divider::after {
            right: 0;
        }
        
        .btn-google {
            width: 100%;
            padding: 15px;
            font-size: 16px;
            font-weight: bold;
            background: white;
            color: #000;
            border: 3px solid #000;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .btn-google:hover {
            background: #000;
            color: white;
        }
        
        .back-link {
            display: block;
            text-align: center;
            margin-top: 20px;
            color: #666;
            text-decoration: none;
            font-size: 14px;
        }
        
        .back-link:hover {
            color: #000;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>DAMIUM</h1>
        
        <form>
            <div class="input-group">
                <label for="usuario">Usuário</label>
                <input type="text" id="usuario" name="usuario" required>
            </div>
            
            <div class="input-group">
                <label for="senha">Senha</label>
                <input type="password" id="senha" name="senha" required>
            </div>
            
            <button type="submit" class="btn-login">ENTRAR</button>
        </form>
        
        <div class="divider">OU</div>
        
        <button class="btn-google" onclick="alert('Login com Google em breve!')">
            <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Entrar com Google
        </button>
        
        <a href="index.html" class="back-link">← Voltar ao menu</a>
    </div>
</body>
</html>