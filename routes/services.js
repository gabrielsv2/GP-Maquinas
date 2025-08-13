const express = require('express');
const { body, validationResult } = require('express-validator');
const authRouter = require('./auth');
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token de acesso necessário' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const config = require('../config');
        const decoded = jwt.verify(token, config.security.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Token inválido ou expirado' });
    }
};

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
const db = require('../database');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Listar todos os serviços (admin) ou serviços da loja específica
router.get('/', async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'admin') {
            // Admin vê todos os serviços
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                ORDER BY s.service_date DESC
            `;
            params = [];
        } else {
            // Usuário de loja vê apenas seus serviços
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                WHERE s.store_id = $1
                ORDER BY s.service_date DESC
            `;
            params = [req.user.store];
        }

        const result = await db.query(query, params);
        res.json({
            success: true,
            services: result.rows
        });

    } catch (error) {
        console.error('Erro ao listar serviços:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Obter serviço por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        let query, params;
        if (req.user.role === 'admin') {
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                WHERE s.service_id = $1
            `;
            params = [id];
        } else {
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                WHERE s.service_id = $1 AND s.store_id = $2
            `;
            params = [id, req.user.store];
        }

        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        res.json({
            success: true,
            service: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao buscar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Criar novo serviço
router.post('/', [
    body('machineCode').notEmpty().withMessage('Código da máquina é obrigatório'),
    body('machineType').notEmpty().withMessage('Tipo da máquina é obrigatório'),
    body('storeId').notEmpty().withMessage('ID da loja é obrigatório'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('serviceTypeId').notEmpty().withMessage('Tipo de serviço é obrigatório'),
    body('technicianId').notEmpty().withMessage('Técnico é obrigatório'),
    body('serviceDate').notEmpty().withMessage('Data do serviço é obrigatória'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('cost').isFloat({ min: 0 }).withMessage('Custo deve ser um número positivo')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            machineCode,
            machineType,
            storeId,
            location,
            serviceTypeId,
            technicianId,
            serviceDate,
            description,
            cost,

            status = 'completed',
            notes = '',
            estimatedDurationHours,
            actualDurationHours,
            partsUsed,
            warrantyUntil
        } = req.body;

        // Verificar se usuário tem acesso à loja
        if (req.user.role !== 'admin' && req.user.store !== storeId) {
            return res.status(403).json({ 
                error: 'Acesso negado a esta loja' 
            });
        }

        // Verificar se a loja existe
        const storeResult = await db.query(
            'SELECT store_id FROM stores WHERE store_id = $1 AND is_active = true',
            [storeId]
        );

        if (storeResult.rows.length === 0) {
            return res.status(400).json({ error: 'Loja não encontrada' });
        }

        // Verificar se o tipo de serviço existe
        const serviceTypeResult = await db.query(
            'SELECT service_type_id FROM service_types WHERE service_type_id = $1',
            [serviceTypeId]
        );

        if (serviceTypeResult.rows.length === 0) {
            return res.status(400).json({ error: 'Tipo de serviço não encontrado' });
        }

        // Verificar se o técnico existe
        const technicianResult = await db.query(
            'SELECT technician_id FROM technicians WHERE technician_id = $1 AND is_active = true',
            [technicianId]
        );

        if (technicianResult.rows.length === 0) {
            return res.status(400).json({ error: 'Técnico não encontrado' });
        }

        // Inserir serviço
        const insertQuery = `
            INSERT INTO services (
                machine_code, machine_type, store_id, location, service_type_id,
                technician_id, service_date, description, cost, status,
                notes, estimated_duration_hours, actual_duration_hours, parts_used,
                warranty_until, record_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *
        `;

        const insertParams = [
            machineCode, machineType, storeId, location, serviceTypeId,
            technicianId, serviceDate, description, cost, status,
            notes, estimatedDurationHours, actualDurationHours, partsUsed,
            warrantyUntil, new Date().toISOString().split('T')[0]
        ];

        const result = await db.query(insertQuery, insertParams);
        
        res.status(201).json({
            success: true,
            message: 'Serviço criado com sucesso',
            service: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Atualizar serviço
router.put('/:id', [
    body('machineCode').notEmpty().withMessage('Código da máquina é obrigatório'),
    body('machineType').notEmpty().withMessage('Tipo da máquina é obrigatório'),
    body('location').notEmpty().withMessage('Localização é obrigatória'),
    body('description').notEmpty().withMessage('Descrição é obrigatória'),
    body('cost').isFloat({ min: 0 }).withMessage('Custo deve ser um número positivo')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { id } = req.params;
        const updateData = req.body;

        // Verificar se o serviço existe e se o usuário tem acesso
        let checkQuery, checkParams;
        if (req.user.role === 'admin') {
            checkQuery = 'SELECT service_id, store_id FROM services WHERE service_id = $1';
            checkParams = [id];
        } else {
            checkQuery = 'SELECT service_id, store_id FROM services WHERE service_id = $1 AND store_id = $2';
            checkParams = [id, req.user.store];
        }

        const checkResult = await db.query(checkQuery, checkParams);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        // Atualizar serviço
        const updateQuery = `
            UPDATE services SET
                machine_code = $1,
                machine_type = $2,
                location = $3,
                description = $4,
                cost = $5,
                status = $6,
                notes = $7,
                estimated_duration_hours = $8,
                actual_duration_hours = $9,
                parts_used = $10,
                warranty_until = $11,
                updated_at = CURRENT_TIMESTAMP
            WHERE service_id = $12
            RETURNING *
        `;

        const updateParams = [
            updateData.machineCode,
            updateData.machineType,
            updateData.location,
            updateData.description,
            updateData.cost,
            updateData.status || 'completed',
            updateData.notes || '',
            updateData.estimatedDurationHours,
            updateData.actualDurationHours,
            updateData.partsUsed,
            updateData.warrantyUntil,
            id
        ];

        const result = await db.query(updateQuery, updateParams);
        
        res.json({
            success: true,
            message: 'Serviço atualizado com sucesso',
            service: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Deletar serviço
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar se o serviço existe e se o usuário tem acesso
        let checkQuery, checkParams;
        if (req.user.role === 'admin') {
            checkQuery = 'SELECT service_id, store_id FROM services WHERE service_id = $1';
            checkParams = [id];
        } else {
            checkQuery = 'SELECT service_id, store_id FROM services WHERE service_id = $1 AND store_id = $2';
            checkParams = [id, req.user.store];
        }

        const checkResult = await db.query(checkQuery, checkParams);
        
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Serviço não encontrado' });
        }

        // Deletar serviço
        await db.query('DELETE FROM services WHERE service_id = $1', [id]);
        
        res.json({
            success: true,
            message: 'Serviço deletado com sucesso'
        });

    } catch (error) {
        console.error('Erro ao deletar serviço:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Buscar serviços por máquina
router.get('/machine/:machineCode', async (req, res) => {
    try {
        const { machineCode } = req.params;
        
        let query, params;
        if (req.user.role === 'admin') {
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                WHERE s.machine_code = $1
                ORDER BY s.service_date DESC
            `;
            params = [machineCode];
        } else {
            query = `
                SELECT s.*, st.service_name, t.technician_name, s2.store_name
                FROM services s
                JOIN service_types st ON s.service_type_id = st.service_type_id
                JOIN technicians t ON s.technician_id = t.technician_id
                JOIN stores s2 ON s.store_id = s2.store_id
                WHERE s.machine_code = $1 AND s.store_id = $2
                ORDER BY s.service_date DESC
            `;
            params = [machineCode, req.user.store];
        }

        const result = await db.query(query, params);
        
        res.json({
            success: true,
            services: result.rows
        });

    } catch (error) {
        console.error('Erro ao buscar serviços da máquina:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

module.exports = router;
