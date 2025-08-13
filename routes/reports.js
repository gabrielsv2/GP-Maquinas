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

// Gerar relatório de loja
router.post('/store', [
    body('storeId').notEmpty().withMessage('ID da loja é obrigatório'),
    body('startDate').isISO8601().withMessage('Data inicial deve ser válida'),
    body('endDate').isISO8601().withMessage('Data final deve ser válida')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { storeId, startDate, endDate } = req.body;

        // Verificar se usuário tem acesso à loja
        if (req.user.role !== 'admin' && req.user.store !== storeId) {
            return res.status(403).json({ 
                error: 'Acesso negado a esta loja' 
            });
        }

        // Verificar se a loja existe
        const storeResult = await db.query(
            'SELECT store_id, store_name, region FROM stores WHERE store_id = $1 AND is_active = true',
            [storeId]
        );

        if (storeResult.rows.length === 0) {
            return res.status(400).json({ error: 'Loja não encontrada' });
        }

        const store = storeResult.rows[0];

        // Buscar dados da loja
        const servicesQuery = `
            SELECT 
                s.*,
                st.service_name,
                t.technician_name
            FROM services s
            JOIN service_types st ON s.service_type_id = st.service_type_id
            JOIN technicians t ON s.technician_id = t.technician_id
            WHERE s.store_id = $1 
            AND s.service_date BETWEEN $2 AND $3
            ORDER BY s.service_date DESC
        `;

        const servicesResult = await db.query(servicesQuery, [storeId, startDate, endDate]);

        // Calcular estatísticas
        const services = servicesResult.rows;
        const totalServices = services.length;
        const totalCost = services.reduce((sum, service) => sum + parseFloat(service.cost), 0);
        const uniqueMachines = new Set(services.map(s => s.machine_code)).size;
        const uniqueTechnicians = new Set(services.map(s => s.technician_id)).size;

        // Agrupar por status
        const statusCount = services.reduce((acc, service) => {
            acc[service.status] = (acc[service.status] || 0) + 1;
            return acc;
        }, {});

        // Agrupar por tipo de serviço
        const serviceTypeCount = services.reduce((acc, service) => {
            acc[service.service_name] = (acc[service.service_name] || 0) + 1;
            return acc;
        }, {});

        // Criar relatório
        const report = {
            storeInfo: {
                storeId: store.store_id,
                storeName: store.store_name,
                region: store.region
            },
            period: {
                startDate,
                endDate
            },
            summary: {
                totalServices,
                totalCost: totalCost.toFixed(2),
                uniqueMachines,
                uniqueTechnicians,
                averageCost: totalServices > 0 ? (totalCost / totalServices).toFixed(2) : '0.00'
            },
            statusBreakdown: statusCount,
            serviceTypeBreakdown: serviceTypeCount,
            services: services.map(s => ({
                id: s.service_id,
                machineCode: s.machine_code,
                machineType: s.machine_type,
                serviceType: s.service_name,
                technician: s.technician_name,
                serviceDate: s.service_date,
                cost: s.cost,
                status: s.status,

            }))
        };

        // Salvar relatório no banco
        const insertReportQuery = `
            INSERT INTO reports (
                report_type, store_id, report_date, report_period_start, 
                report_period_end, report_data, report_format
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING report_id
        `;

        const reportParams = [
            'store_summary',
            storeId,
            new Date().toISOString().split('T')[0],
            startDate,
            endDate,
            JSON.stringify(report),
            'json'
        ];

        const reportResult = await db.query(insertReportQuery, reportParams);

        res.json({
            success: true,
            message: 'Relatório gerado com sucesso',
            reportId: reportResult.rows[0].report_id,
            report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Gerar relatório financeiro
router.post('/financial', [
    body('startDate').isISO8601().withMessage('Data inicial deve ser válida'),
    body('endDate').isISO8601().withMessage('Data final deve ser válida'),
    body('storeId').optional().isString().withMessage('ID da loja deve ser string')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startDate, endDate, storeId } = req.body;

        let query, params;

        if (storeId && req.user.role !== 'admin') {
            // Verificar se usuário tem acesso à loja
            if (req.user.store !== storeId) {
                return res.status(403).json({ 
                    error: 'Acesso negado a esta loja' 
                });
            }

            query = `
                SELECT 
                    s.store_name,
                    s.region,
                    COUNT(sv.service_id) as total_services,
                    SUM(sv.cost) as total_cost,
                    AVG(sv.cost) as average_cost,
                    MIN(sv.cost) as min_cost,
                    MAX(sv.cost) as max_cost,
                    COUNT(DISTINCT sv.technician_id) as technicians_used,
                    COUNT(DISTINCT sv.machine_code) as machines_serviced
                FROM stores s
                LEFT JOIN services sv ON s.store_id = sv.store_id
                WHERE s.store_id = $1 
                AND sv.service_date BETWEEN $2 AND $3
                GROUP BY s.store_id, s.store_name, s.region
            `;
            params = [storeId, startDate, endDate];
        } else if (req.user.role === 'admin') {
            // Admin vê todas as lojas
            query = `
                SELECT 
                    s.store_name,
                    s.region,
                    COUNT(sv.service_id) as total_services,
                    SUM(sv.cost) as total_cost,
                    AVG(sv.cost) as average_cost,
                    MIN(sv.cost) as min_cost,
                    MAX(sv.cost) as max_cost,
                    COUNT(DISTINCT sv.technician_id) as technicians_used,
                    COUNT(DISTINCT sv.machine_code) as machines_serviced
                FROM stores s
                LEFT JOIN services sv ON s.store_id = sv.store_id
                WHERE sv.service_date BETWEEN $1 AND $2
                GROUP BY s.store_id, s.store_name, s.region
                ORDER BY total_cost DESC NULLS LAST
            `;
            params = [startDate, endDate];
        } else {
            // Usuário de loja vê apenas sua loja
            query = `
                SELECT 
                    s.store_name,
                    s.region,
                    COUNT(sv.service_id) as total_services,
                    SUM(sv.cost) as total_cost,
                    AVG(sv.cost) as average_cost,
                    MIN(sv.cost) as min_cost,
                    MAX(sv.cost) as max_cost,
                    COUNT(DISTINCT sv.technician_id) as technicians_used,
                    COUNT(DISTINCT sv.machine_code) as machines_serviced
                FROM stores s
                LEFT JOIN services sv ON s.store_id = sv.store_id
                WHERE s.store_id = $1 
                AND sv.service_date BETWEEN $2 AND $3
                GROUP BY s.store_id, s.store_name, s.region
            `;
            params = [req.user.store, startDate, endDate];
        }

        const result = await db.query(query, params);

        // Calcular totais gerais
        const totalData = result.rows.reduce((acc, row) => {
            acc.totalServices += parseInt(row.total_services) || 0;
            acc.totalCost += parseFloat(row.total_cost) || 0;
            acc.totalTechnicians += parseInt(row.technicians_used) || 0;
            acc.totalMachines += parseInt(row.machines_serviced) || 0;
            return acc;
        }, {
            totalServices: 0,
            totalCost: 0,
            totalTechnicians: 0,
            totalMachines: 0
        });

        const report = {
            period: { startDate, endDate },
            stores: result.rows.map(row => ({
                storeName: row.store_name,
                region: row.region,
                totalServices: parseInt(row.total_services) || 0,
                totalCost: parseFloat(row.total_cost) || 0,
                averageCost: parseFloat(row.average_cost) || 0,
                minCost: parseFloat(row.min_cost) || 0,
                maxCost: parseFloat(row.max_cost) || 0,
                techniciansUsed: parseInt(row.technicians_used) || 0,
                machinesServiced: parseInt(row.machines_serviced) || 0
            })),
            summary: {
                totalStores: result.rows.length,
                totalServices: totalData.totalServices,
                totalCost: totalData.totalCost.toFixed(2),
                totalTechnicians: totalData.totalTechnicians,
                totalMachines: totalData.totalMachines,
                averageCostPerService: totalData.totalServices > 0 ? 
                    (totalData.totalCost / totalData.totalServices).toFixed(2) : '0.00'
            }
        };

        res.json({
            success: true,
            message: 'Relatório financeiro gerado com sucesso',
            report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório financeiro:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Gerar relatório de técnicos
router.post('/technicians', [
    body('startDate').isISO8601().withMessage('Data inicial deve ser válida'),
    body('endDate').isISO8601().withMessage('Data final deve ser válida')
], async (req, res) => {
    try {
        // Validar dados de entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startDate, endDate } = req.body;

        let query, params;

        if (req.user.role === 'admin') {
            // Admin vê todos os técnicos
            query = `
                SELECT 
                    t.technician_id,
                    t.technician_name,
                    t.specialization,
                    t.hourly_rate,
                    COUNT(sv.service_id) as total_services,
                    SUM(sv.cost) as total_cost,
                    COUNT(DISTINCT sv.machine_code) as machines_serviced,
                    COUNT(DISTINCT sv.store_id) as stores_served,
                    MAX(sv.service_date) as last_service_date,
                    AVG(sv.actual_duration_hours) as average_duration,
                    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services
                FROM technicians t
                LEFT JOIN services sv ON t.technician_id = sv.technician_id
                WHERE sv.service_date BETWEEN $1 AND $2 OR sv.service_date IS NULL
                GROUP BY t.technician_id, t.technician_name, t.specialization, t.hourly_rate
                ORDER BY total_services DESC
            `;
            params = [startDate, endDate];
        } else {
            // Usuário de loja vê apenas técnicos que trabalharam em sua loja
            query = `
                SELECT 
                    t.technician_id,
                    t.technician_name,
                    t.specialization,
                    t.hourly_rate,
                    COUNT(sv.service_id) as total_services,
                    SUM(sv.cost) as total_cost,
                    COUNT(DISTINCT sv.machine_code) as machines_serviced,
                    COUNT(DISTINCT sv.store_id) as stores_served,
                    MAX(sv.service_date) as last_service_date,
                    AVG(sv.actual_duration_hours) as average_duration,
                    COUNT(CASE WHEN sv.status = 'completed' THEN 1 END) as completed_services
                FROM technicians t
                LEFT JOIN services sv ON t.technician_id = sv.technician_id
                WHERE (sv.service_date BETWEEN $1 AND $2 OR sv.service_date IS NULL)
                AND (sv.store_id = $3 OR sv.store_id IS NULL)
                GROUP BY t.technician_id, t.technician_name, t.specialization, t.hourly_rate
                ORDER BY total_services DESC
            `;
            params = [startDate, endDate, req.user.store];
        }

        const result = await db.query(query, params);

        const report = {
            period: { startDate, endDate },
            technicians: result.rows.map(row => ({
                id: row.technician_id,
                name: row.technician_name,
                specialization: row.specialization,
                hourlyRate: parseFloat(row.hourly_rate) || 0,
                totalServices: parseInt(row.total_services) || 0,
                totalCost: parseFloat(row.total_cost) || 0,
                machinesServiced: parseInt(row.machines_serviced) || 0,
                storesServed: parseInt(row.stores_served) || 0,
                lastServiceDate: row.last_service_date,
                averageDuration: parseFloat(row.average_duration) || 0,
                completedServices: parseInt(row.completed_services) || 0
            })),
            summary: {
                totalTechnicians: result.rows.length,
                totalServices: result.rows.reduce((sum, row) => sum + (parseInt(row.total_services) || 0), 0),
                totalCost: result.rows.reduce((sum, row) => sum + (parseFloat(row.total_cost) || 0), 0).toFixed(2)
            }
        };

        res.json({
            success: true,
            message: 'Relatório de técnicos gerado com sucesso',
            report
        });

    } catch (error) {
        console.error('Erro ao gerar relatório de técnicos:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Listar relatórios salvos
router.get('/', async (req, res) => {
    try {
        let query, params;

        if (req.user.role === 'admin') {
            // Admin vê todos os relatórios
            query = `
                SELECT r.*, s2.store_name
                FROM reports r
                LEFT JOIN stores s2 ON r.store_id = s2.store_id
                ORDER BY r.created_at DESC
                LIMIT 50
            `;
            params = [];
        } else {
            // Usuário de loja vê apenas relatórios de sua loja
            query = `
                SELECT r.*, s2.store_name
                FROM reports r
                LEFT JOIN stores s2 ON r.store_id = s2.store_id
                WHERE r.store_id = $1
                ORDER BY r.created_at DESC
                LIMIT 50
            `;
            params = [req.user.store];
        }

        const result = await db.query(query, params);

        res.json({
            success: true,
            reports: result.rows.map(row => ({
                id: row.report_id,
                type: row.report_type,
                storeName: row.store_name,
                reportDate: row.report_date,
                periodStart: row.report_period_start,
                periodEnd: row.report_period_end,
                format: row.report_format,
                createdAt: row.created_at
            }))
        });

    } catch (error) {
        console.error('Erro ao listar relatórios:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

// Obter relatório específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let query, params;
        if (req.user.role === 'admin') {
            query = `
                SELECT r.*, s2.store_name
                FROM reports r
                LEFT JOIN stores s2 ON r.store_id = s2.store_id
                WHERE r.report_id = $1
            `;
            params = [id];
        } else {
            query = `
                SELECT r.*, s2.store_name
                FROM reports r
                LEFT JOIN stores s2 ON r.store_id = s2.store_id
                WHERE r.report_id = $1 AND r.store_id = $2
            `;
            params = [id, req.user.store];
        }

        const result = await db.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Relatório não encontrado' });
        }

        const report = result.rows[0];

        res.json({
            success: true,
            report: {
                id: report.report_id,
                type: report.report_type,
                storeName: report.store_name,
                reportDate: report.report_date,
                periodStart: report.report_period_start,
                periodEnd: report.report_period_end,
                data: JSON.parse(report.report_data),
                format: report.report_format,
                createdAt: report.created_at
            }
        });

    } catch (error) {
        console.error('Erro ao buscar relatório:', error);
        res.status(500).json({ 
            error: 'Erro interno do servidor' 
        });
    }
});

module.exports = router;
