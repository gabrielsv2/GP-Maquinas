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

        // Verificar se é admin
        if (username === 'admin' && password === 'admin') {
            const token = jwt.sign(
                { 
                    id: 0, 
                    username: 'admin', 
                    role: 'admin',
                    store: null
                },
                config.security.jwtSecret,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token,
                user: {
                    id: 0,
                    username: 'admin',
                    role: 'admin',
                    fullName: 'Administrador do Sistema',
                    store: null
                }
            });
        }

        // Verificar se é usuário de loja
        if (password === '123456') {
            // Buscar loja no banco
            const storeResult = await db.query(
                'SELECT store_id, store_name FROM stores WHERE store_id = $1 AND is_active = true',
                [username]
            );

            if (storeResult.rows.length > 0) {
                const store = storeResult.rows[0];
                const token = jwt.sign(
                    { 
                        id: store.store_id, 
                        username: store.store_id, 
                        role: 'store',
                        store: store.store_id
                    },
                    config.security.jwtSecret,
                    { expiresIn: '24h' }
                );

                return res.json({
                    success: true,
                    token,
                    user: {
                        id: store.store_id,
                        username: store.store_id,
                        role: 'store',
                        fullName: store.store_name,
                        store: store.store_id
                    }
                });
            }
        }

        // Login inválido
        return res.status(401).json({ 
            error: 'Usuário ou senha incorretos' 
        });

    } catch (error) {
        console.error('Erro no login:', error);
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
        if (req.user.role === 'admin') {
            return res.json({
                id: 0,
                username: 'admin',
                role: 'admin',
                fullName: 'Administrador do Sistema',
                store: null
            });
        }

        // Buscar informações da loja
        const storeResult = await db.query(
            'SELECT store_id, store_name, region FROM stores WHERE store_id = $1 AND is_active = true',
            [req.user.store]
        );

        if (storeResult.rows.length === 0) {
            return res.status(404).json({ error: 'Loja não encontrada' });
        }

        const store = storeResult.rows[0];
        res.json({
            id: store.store_id,
            username: store.store_id,
            role: 'store',
            fullName: store.store_name,
            store: store.store_id,
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
