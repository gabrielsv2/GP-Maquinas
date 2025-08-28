const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const config = require('../config');
const db = require('../database');

const router = express.Router();

// Middleware para validar token JWT
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const decoded = jwt.verify(token, config.security.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

// Login
router.post('/login', [
    body('username').notEmpty().withMessage('Usuário é obrigatório'),
    body('password').notEmpty().withMessage('Senha é obrigatória')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Buscar usuário no banco de dados
        const userResult = await db.query(
            'SELECT user_id, username, password_hash, role, store_id, full_name FROM users WHERE username = $1 AND is_active = true',
            [username]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({ 
                error: 'Usuário ou senha incorretos' 
            });
        }

        const user = userResult.rows[0];

        // Verificar senha
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: 'Usuário ou senha incorretos' 
            });
        }

        // Gerar token JWT
        const tokenPayload = {
            id: user.user_id,
            username: user.username,
            role: user.role,
            store: user.store_id
        };

        const token = jwt.sign(tokenPayload, config.security.jwtSecret, { expiresIn: '24h' });

        // Retornar resposta de sucesso
        return res.json({
            success: true,
            token,
            user: {
                id: user.user_id,
                username: user.username,
                role: user.role,
                fullName: user.full_name,
                store: user.store_id
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        
        // Verificar se é um erro de conexão com banco
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return res.status(503).json({ 
                error: 'Serviço indisponível',
                details: 'Banco de dados não está acessível'
            });
        } else if (error.code === '28P01') {
            return res.status(500).json({ 
                error: 'Erro de autenticação',
                details: 'Credenciais do banco de dados inválidas'
            });
        } else if (error.code === '3D000') {
            return res.status(500).json({ 
                error: 'Banco não encontrado',
                details: 'O banco de dados especificado não existe'
            });
        }
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (config.app.environment === 'development') {
            return res.status(500).json({ 
                error: 'Erro interno do servidor',
                details: error.message,
                code: error.code
            });
        }
        
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Verificar token
router.get('/verify', authenticateToken, (req, res) => {
    res.json({
        valid: true,
        user: req.user
    });
});

// Logout (cliente deve remover o token)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        message: 'Logout realizado com sucesso' 
    });
});

// Obter perfil do usuário
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // Buscar informações do usuário
        const userResult = await db.query(
            'SELECT user_id, username, role, store_id, full_name FROM users WHERE user_id = $1 AND is_active = true',
            [req.user.id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const user = userResult.rows[0];

        if (user.role === 'admin') {
            return res.json({
                id: user.user_id,
                username: user.username,
                role: user.role,
                fullName: user.full_name,
                store: null
            });
        }

        // Para usuários de loja, buscar informações adicionais da loja
        const storeResult = await db.query(
            'SELECT store_id, store_name, region FROM stores WHERE store_id = $1 AND is_active = true',
            [user.store_id]
        );

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        const store = storeResult.rows[0];
        res.json({
            id: user.user_id,
            username: user.username,
            role: user.role,
            fullName: user.full_name,
            store: user.store_id,
            region: store.region
        });

    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Middleware para verificar se é admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Acesso negado. Apenas administradores.' 
        });
    }
    next();
};

// Middleware para verificar se é admin ou usuário da loja específica
const requireStoreAccess = (req, res, next) => {
    if (req.user.role === 'admin') {
        return next();
    }
    
    const storeId = req.params.storeId || req.body.storeId;
    if (req.user.store !== storeId) {
        return res.status(403).json({ 
            error: 'Acesso negado a esta loja' 
        });
    }
    
    next();
};

module.exports = router;
