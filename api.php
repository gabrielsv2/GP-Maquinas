<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$db_config = [
    'host' => 'localhost',
    'dbname' => 'gp_maquinas_db',
    'username' => 'root', // Change to your database username
    'password' => '', // Change to your database password
    'charset' => 'utf8mb4'
];

// Error handling
function sendError($message, $code = 400) {
    http_response_code($code);
    echo json_encode(['error' => $message]);
    exit();
}

function sendSuccess($data, $message = 'Success') {
    echo json_encode([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}

// Database connection
function getDBConnection() {
    global $db_config;
    
    try {
        $dsn = "mysql:host={$db_config['host']};dbname={$db_config['dbname']};charset={$db_config['charset']}";
        $pdo = new PDO($dsn, $db_config['username'], $db_config['password'], [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);
        return $pdo;
    } catch (PDOException $e) {
        sendError('Database connection failed: ' . $e->getMessage(), 500);
    }
}

// Authentication functions
function authenticateUser($username, $password) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("CALL AuthenticateUser(?, ?)");
    $stmt->execute([$username, password_hash($password, PASSWORD_DEFAULT)]);
    $result = $stmt->fetch();
    
    if ($result && $result['authenticated']) {
        return [
            'user_id' => $result['user_id'],
            'user_role' => $result['user_role'],
            'store_id' => $result['store_id'],
            'full_name' => $result['full_name'],
            'email' => $result['email'],
            'permissions' => json_decode($result['permissions'], true)
        ];
    }
    
    return null;
}

function createSession($user_id, $device_info = '', $ip_address = '', $user_agent = '') {
    $pdo = getDBConnection();
    
    $session_id = bin2hex(random_bytes(32));
    $ip_address = $ip_address ?: $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $user_agent ?: $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $stmt = $pdo->prepare("CALL CreateUserSession(?, ?, ?, ?, ?, 24)");
    $stmt->execute([$user_id, $session_id, $device_info, $ip_address, $user_agent]);
    
    return $session_id;
}

function validateSession($session_id) {
    $pdo = getDBConnection();
    
    $stmt = $pdo->prepare("CALL ValidateSession(?)");
    $stmt->execute([$session_id]);
    $result = $stmt->fetch();
    
    if ($result && $result['valid']) {
        return [
            'user_id' => $result['user_id'],
            'user_role' => $result['user_role'],
            'full_name' => $result['full_name'],
            'email' => $result['email'],
            'permissions' => json_decode($result['permissions'], true)
        ];
    }
    
    return null;
}

// Get authorization header
function getAuthorizationHeader() {
    $headers = null;
    
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    
    return $headers;
}

function getBearerToken() {
    $headers = getAuthorizationHeader();
    
    if (!empty($headers)) {
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            return $matches[1];
        }
    }
    return null;
}

// Check if user is authenticated
function requireAuth() {
    $token = getBearerToken();
    
    if (!$token) {
        sendError('No authorization token provided', 401);
    }
    
    $user = validateSession($token);
    
    if (!$user) {
        sendError('Invalid or expired session', 401);
    }
    
    return $user;
}

// Check if user has admin permissions
function requireAdmin() {
    $user = requireAuth();
    
    if ($user['user_role'] !== 'admin') {
        sendError('Admin access required', 403);
    }
    
    return $user;
}

// API Routes
$request_method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$path_parts = explode('/', trim($path, '/'));

// Remove 'api.php' from path if present
if (in_array('api.php', $path_parts)) {
    $path_parts = array_filter($path_parts, function($part) {
        return $part !== 'api.php';
    });
}

$endpoint = end($path_parts);

try {
    switch ($endpoint) {
        case 'login':
            if ($request_method === 'POST') {
                $input = json_decode(file_get_contents('php://input'), true);
                
                if (!isset($input['username']) || !isset($input['password'])) {
                    sendError('Username and password are required');
                }
                
                $user = authenticateUser($input['username'], $input['password']);
                
                if ($user) {
                    $session_id = createSession($user['user_id']);
                    
                    sendSuccess([
                        'session_id' => $session_id,
                        'user' => $user
                    ], 'Login successful');
                } else {
                    sendError('Invalid credentials', 401);
                }
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'logout':
            if ($request_method === 'POST') {
                $user = requireAuth();
                $token = getBearerToken();
                
                $pdo = getDBConnection();
                $stmt = $pdo->prepare("UPDATE user_sessions SET is_active = FALSE WHERE session_id = ?");
                $stmt->execute([$token]);
                
                sendSuccess(null, 'Logout successful');
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'stores':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $stmt = $pdo->query("SELECT * FROM stores WHERE is_active = TRUE ORDER BY store_name");
                $stores = $stmt->fetchAll();
                
                sendSuccess($stores);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'store-summary':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $store_id = $_GET['store_id'] ?? null;
                
                if ($store_id) {
                    $stmt = $pdo->prepare("SELECT * FROM store_summary_view WHERE store_id = ?");
                    $stmt->execute([$store_id]);
                    $summary = $stmt->fetch();
                    
                    if (!$summary) {
                        sendError('Store not found', 404);
                    }
                    
                    sendSuccess($summary);
                } else {
                    $stmt = $pdo->query("SELECT * FROM store_summary_view ORDER BY store_name");
                    $summaries = $stmt->fetchAll();
                    
                    sendSuccess($summaries);
                }
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'financial-summary':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $start_date = $_GET['start_date'] ?? date('Y-m-01');
                $end_date = $_GET['end_date'] ?? date('Y-m-t');
                $store_id = $_GET['store_id'] ?? null;
                
                $stmt = $pdo->prepare("CALL GetFinancialSummary(?, ?, ?)");
                $stmt->execute([$start_date, $end_date, $store_id]);
                $summary = $stmt->fetchAll();
                
                sendSuccess($summary);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'maintenance-schedule':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $days_ahead = $_GET['days_ahead'] ?? 30;
                $store_id = $_GET['store_id'] ?? null;
                
                $stmt = $pdo->prepare("CALL GetMaintenanceSchedule(?, ?)");
                $stmt->execute([$days_ahead, $store_id]);
                $schedule = $stmt->fetchAll();
                
                sendSuccess($schedule);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'machines':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $store_id = $_GET['store_id'] ?? null;
                $status = $_GET['status'] ?? null;
                
                $sql = "SELECT * FROM machine_details_view WHERE 1=1";
                $params = [];
                
                if ($store_id) {
                    $sql .= " AND store_id = ?";
                    $params[] = $store_id;
                }
                
                if ($status) {
                    $sql .= " AND status = ?";
                    $params[] = $status;
                }
                
                $sql .= " ORDER BY store_name, machine_type";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $machines = $stmt->fetchAll();
                
                sendSuccess($machines);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'services':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $store_id = $_GET['store_id'] ?? null;
                $start_date = $_GET['start_date'] ?? null;
                $end_date = $_GET['end_date'] ?? null;
                $technician_id = $_GET['technician_id'] ?? null;
                
                $sql = "SELECT 
                            sv.*,
                            mt.type_name as machine_type,
                            s.store_name,
                            t.technician_name,
                            st.service_name as service_type_name
                        FROM services sv
                        JOIN machines m ON sv.machine_id = m.machine_id
                        JOIN machine_types mt ON m.type_id = mt.type_id
                        JOIN stores s ON m.store_id = s.store_id
                        JOIN technicians t ON sv.technician_id = t.technician_id
                        JOIN service_types st ON sv.service_type_id = st.service_type_id
                        WHERE 1=1";
                $params = [];
                
                if ($store_id) {
                    $sql .= " AND s.store_id = ?";
                    $params[] = $store_id;
                }
                
                if ($start_date) {
                    $sql .= " AND sv.service_date >= ?";
                    $params[] = $start_date;
                }
                
                if ($end_date) {
                    $sql .= " AND sv.service_date <= ?";
                    $params[] = $end_date;
                }
                
                if ($technician_id) {
                    $sql .= " AND sv.technician_id = ?";
                    $params[] = $technician_id;
                }
                
                $sql .= " ORDER BY sv.service_date DESC";
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $services = $stmt->fetchAll();
                
                sendSuccess($services);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'providers':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $stmt = $pdo->query("SELECT * FROM provider_summary_view ORDER BY provider_name");
                $providers = $stmt->fetchAll();
                
                sendSuccess($providers);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'technicians':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $stmt = $pdo->query("SELECT * FROM technician_summary_view ORDER BY technician_name");
                $technicians = $stmt->fetchAll();
                
                sendSuccess($technicians);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'dashboard':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                // Get dashboard statistics
                $stats = [];
                
                // Total stores
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM stores WHERE is_active = TRUE");
                $stats['total_stores'] = $stmt->fetch()['total'];
                
                // Total machines
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM machines");
                $stats['total_machines'] = $stmt->fetch()['total'];
                
                // Active machines
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM machines WHERE status = 'active'");
                $stats['active_machines'] = $stmt->fetch()['total'];
                
                // Machines in maintenance
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM machines WHERE status = 'maintenance'");
                $stats['machines_in_maintenance'] = $stmt->fetch()['total'];
                
                // Total services this month
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM services WHERE MONTH(service_date) = MONTH(CURDATE()) AND YEAR(service_date) = YEAR(CURDATE())");
                $stats['services_this_month'] = $stmt->fetch()['total'];
                
                // Total cost this month
                $stmt = $pdo->query("SELECT COALESCE(SUM(cost), 0) as total FROM services WHERE MONTH(service_date) = MONTH(CURDATE()) AND YEAR(service_date) = YEAR(CURDATE())");
                $stats['cost_this_month'] = $stmt->fetch()['total'];
                
                // Urgent maintenance needed
                $stmt = $pdo->query("SELECT COUNT(*) as total FROM machines WHERE next_maintenance_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND status IN ('active', 'maintenance')");
                $stats['urgent_maintenance'] = $stmt->fetch()['total'];
                
                // Recent activities
                $stmt = $pdo->query("SELECT 
                                        'service' as type,
                                        sv.service_date as date,
                                        CONCAT(t.technician_name, ' - ', st.service_name) as description,
                                        s.store_name as location
                                    FROM services sv
                                    JOIN technicians t ON sv.technician_id = t.technician_id
                                    JOIN service_types st ON sv.service_type_id = st.service_type_id
                                    JOIN machines m ON sv.machine_id = m.machine_id
                                    JOIN stores s ON m.store_id = s.store_id
                                    ORDER BY sv.service_date DESC
                                    LIMIT 10");
                $stats['recent_activities'] = $stmt->fetchAll();
                
                sendSuccess($stats);
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        case 'reports':
            if ($request_method === 'GET') {
                $user = requireAuth();
                $pdo = getDBConnection();
                
                $report_type = $_GET['type'] ?? null;
                $store_id = $_GET['store_id'] ?? null;
                $limit = $_GET['limit'] ?? 50;
                
                $sql = "SELECT * FROM reports WHERE 1=1";
                $params = [];
                
                if ($report_type) {
                    $sql .= " AND report_type = ?";
                    $params[] = $report_type;
                }
                
                if ($store_id) {
                    $sql .= " AND store_id = ?";
                    $params[] = $store_id;
                }
                
                $sql .= " ORDER BY created_at DESC LIMIT ?";
                $params[] = $limit;
                
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $reports = $stmt->fetchAll();
                
                sendSuccess($reports);
            } elseif ($request_method === 'POST') {
                $user = requireAuth();
                $input = json_decode(file_get_contents('php://input'), true);
                
                $pdo = getDBConnection();
                
                $stmt = $pdo->prepare("CALL GenerateStoreReport(?, ?, ?, ?)");
                $stmt->execute([
                    $input['store_id'],
                    $input['start_date'],
                    $input['end_date'],
                    $user['user_id']
                ]);
                
                $result = $stmt->fetch();
                
                sendSuccess($result, 'Report generated successfully');
            } else {
                sendError('Method not allowed', 405);
            }
            break;
            
        default:
            sendError('Endpoint not found', 404);
            break;
    }
} catch (Exception $e) {
    sendError('Server error: ' . $e->getMessage(), 500);
}
?>
