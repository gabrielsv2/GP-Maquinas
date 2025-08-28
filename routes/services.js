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
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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

// Pesquisar serviços por código de máquina e/ou data
router.get('/search', async (req, res) => {
    try {
        const { machineCode, serviceDate } = req.query;
        
        // Validar se pelo menos um parâmetro foi fornecido
        if (!machineCode && !serviceDate) {
            return res.status(400).json({ 
                error: 'É necessário fornecer pelo menos um critério de pesquisa (código da máquina ou data)' 
            });
        }
        
        let query, params = [];
        let whereConditions = [];
        let paramIndex = 1;
        
        // Construir condições WHERE dinamicamente
        if (machineCode) {
            whereConditions.push(`s.machine_code ILIKE $${paramIndex}`);
            params.push(`%${machineCode}%`);
            paramIndex++;
        }
        
        if (serviceDate) {
            whereConditions.push(`DATE(s.service_date) = $${paramIndex}`);
            params.push(serviceDate);
            paramIndex++;
        }
        
        // Adicionar restrição de loja para usuários não-admin
        if (req.user.role !== 'admin') {
            whereConditions.push(`s.store_id = $${paramIndex}`);
            params.push(req.user.store);
        }
        
        const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
        
        query = `
            SELECT s.*, st.service_name, t.technician_name, s2.store_name
            FROM services s
            JOIN service_types st ON s.service_type_id = st.service_type_id
            JOIN technicians t ON s.technician_id = t.technician_id
            JOIN stores s2 ON s.store_id = s2.store_id
            ${whereClause}
            ORDER BY s.service_date DESC
        `;
        
        const result = await db.query(query, params);
        
        res.json({
            success: true,
            services: result.rows
        });

    } catch (error) {
        console.error('Erro ao pesquisar serviços:', error);
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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

// Criar novo serviço
router.post('/', [
    body('machineCode').notEmpty().trim().withMessage('Código da máquina é obrigatório'),
    body('machineType').notEmpty().trim().withMessage('Tipo da máquina é obrigatório'),
    body('storeId').notEmpty().trim().withMessage('ID da loja é obrigatório'),
    body('location').notEmpty().trim().withMessage('Localização é obrigatória'),
    body('serviceTypeId').notEmpty().trim().withMessage('Tipo de serviço é obrigatório'),
    body('technicianId').isInt({ min: 1 }).withMessage('Técnico deve ser um ID válido'),
    body('serviceDate').isISO8601().toDate().withMessage('Data do serviço deve ser uma data válida'),
    body('description').notEmpty().trim().withMessage('Descrição é obrigatória'),
    body('cost').isFloat({ min: 0 }).withMessage('Custo deve ser um número positivo'),
    body('status').optional().isIn(['completed', 'pending', 'cancelled', 'in_progress']).withMessage('Status deve ser válido'),
    body('notes').optional().trim(),
    body('estimatedDurationHours').optional().isInt({ min: 0 }).withMessage('Duração estimada deve ser um número inteiro positivo'),
    body('actualDurationHours').optional().isInt({ min: 0 }).withMessage('Duração real deve ser um número inteiro positivo'),
    body('partsUsed').optional().trim(),
    body('warrantyUntil').optional().isISO8601().toDate().withMessage('Data de garantia deve ser uma data válida')
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

        // Inserir novo serviço
        const insertQuery = `
            INSERT INTO services (
                machine_code, machine_type, store_id, location, service_type_id,
                technician_id, service_date, record_date, description, cost, status, notes,
                estimated_duration_hours, actual_duration_hours, parts_used, warranty_until,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
            RETURNING *
        `;

        const insertParams = [
            machineCode, machineType, storeId, location, serviceTypeId,
            technicianId, serviceDate, serviceDate, description, cost, status, notes,
            estimatedDurationHours, actualDurationHours, partsUsed, warrantyUntil
        ];

        const result = await db.query(insertQuery, insertParams);
        
        res.status(201).json({
            success: true,
            message: 'Serviço criado com sucesso',
            service: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao criar serviço:', error);
        
        // Verificar se é um erro de validação do banco
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                error: 'Violação de unicidade',
                details: 'Já existe um serviço com essas características'
            });
        } else if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ 
                error: 'Referência inválida',
                details: 'Verifique se a loja, tipo de serviço ou técnico existem'
            });
        } else if (error.code === '23514') { // Check violation
            return res.status(400).json({ 
                error: 'Valor inválido',
                details: 'Um dos campos não atende às restrições do banco'
            });
        }
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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

// Atualizar serviço
router.put('/:id', [
    body('machineCode').notEmpty().trim().withMessage('Código da máquina é obrigatório'),
    body('machineType').notEmpty().trim().withMessage('Tipo da máquina é obrigatório'),
    body('storeId').notEmpty().trim().withMessage('ID da loja é obrigatório'),
    body('location').notEmpty().trim().withMessage('Localização é obrigatória'),
    body('serviceTypeId').notEmpty().trim().withMessage('Tipo de serviço é obrigatório'),
    body('technicianId').isInt({ min: 1 }).withMessage('Técnico deve ser um ID válido'),
    body('serviceDate').isISO8601().toDate().withMessage('Data do serviço deve ser uma data válida'),
    body('description').notEmpty().trim().withMessage('Descrição é obrigatória'),
    body('cost').isFloat({ min: 0 }).withMessage('Custo deve ser um número positivo'),
    body('status').optional().isIn(['completed', 'pending', 'cancelled', 'in_progress']).withMessage('Status deve ser válido'),
    body('notes').optional().trim(),
    body('estimatedDurationHours').optional().isInt({ min: 0 }).withMessage('Duração estimada deve ser um número inteiro positivo'),
    body('actualDurationHours').optional().isInt({ min: 0 }).withMessage('Duração real deve ser um número inteiro positivo'),
    body('partsUsed').optional().trim(),
    body('warrantyUntil').optional().isISO8601().toDate().withMessage('Data de garantia deve ser uma data válida')
], async (req, res) => {
    try {
        const { id } = req.params;
        
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

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
            status,
            notes,
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

        // Atualizar serviço
        const updateQuery = `
            UPDATE services SET
                machine_code = $1, machine_type = $2, store_id = $3, location = $4,
                service_type_id = $5, technician_id = $6, service_date = $7, description = $8,
                cost = $9, status = $10, notes = $11, estimated_duration_hours = $12,
                actual_duration_hours = $13, parts_used = $14, warranty_until = $15,
                updated_at = NOW()
            WHERE service_id = $16
            RETURNING *
        `;

        const updateParams = [
            machineCode, machineType, storeId, location, serviceTypeId,
            technicianId, serviceDate, description, cost, status, notes,
            estimatedDurationHours, actualDurationHours, partsUsed, warrantyUntil, id
        ];

        const result = await db.query(updateQuery, updateParams);
        
        res.json({
            success: true,
            message: 'Serviço atualizado com sucesso',
            service: result.rows[0]
        });

    } catch (error) {
        console.error('Erro ao atualizar serviço:', error);
        
        // Verificar se é um erro de validação do banco
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ 
                error: 'Violação de unicidade',
                details: 'Já existe um serviço com essas características'
            });
        } else if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ 
                error: 'Referência inválida',
                details: 'Verifique se a loja, tipo de serviço ou técnico existem'
            });
        } else if (error.code === '23514') { // Check violation
            return res.status(400).json({ 
                error: 'Valor inválido',
                details: 'Um dos campos não atende às restrições do banco'
            });
        }
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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
        
        // Verificar se é um erro de validação do banco
        if (error.code === '23503') { // Foreign key violation
            return res.status(400).json({ 
                error: 'Não é possível deletar',
                details: 'Este serviço está sendo referenciado por outros registros'
            });
        }
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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
        
        // Para desenvolvimento, retornar mais detalhes do erro
        if (process.env.NODE_ENV === 'development') {
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

module.exports = router;
