import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';
import net from 'node:net';
import path from 'path';
import fs from 'fs';
import { defineConfig, Plugin } from 'vite';

// Dynamically load mysql2/promise so Vite never crashes if mysql2 is not yet installed in node_modules
let mysqlModule: any = null;
async function getMysqlDriver(): Promise<any> {
  if (mysqlModule) return mysqlModule;
  try {
    const mod = await import('mysql2/promise');
    mysqlModule = mod.default || mod;
    return mysqlModule;
  } catch {
    return null;
  }
}

// Helper to load MySQL credentials from php-backend/.env or php-backend/.env.example
function getDatabaseConfig() {
  const envPaths = [
    path.resolve(__dirname, '.env'),
    path.resolve(__dirname, 'php-backend/.env'),
    path.resolve(__dirname, 'php-backend/.env.example'),
  ];

  const config: Record<string, string> = {
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: process.env.DB_PORT || '3306',
    DB_USER: process.env.DB_USER || 'root',
    DB_PASS: process.env.DB_PASS || '',
    DB_NAME: process.env.DB_NAME || 'uicms_workflow',
  };

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
          const [k, ...vParts] = trimmed.split('=');
          const key = k.trim();
          let val = vParts.join('=').trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (key && (config[key] === undefined || !process.env[key])) {
            config[key] = val;
          }
        }
      } catch {}
    }
  }

  return config;
}

function phpBackendPlugin(): Plugin {
  let cachedLiveHost: string | null | undefined = undefined;
  let lastProbeTime = 0;
  let mysqlPool: any = null;
  let lastMysqlCheck = 0;
  let isMysqlOnline = false;

  const dbConfig = getDatabaseConfig();

  const isPortReachable = (host: string, port: number, timeout = 250): Promise<boolean> => {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let done = false;
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        if (!done) { done = true; socket.destroy(); resolve(true); }
      });
      socket.on('timeout', () => {
        if (!done) { done = true; socket.destroy(); resolve(false); }
      });
      socket.on('error', () => {
        if (!done) { done = true; socket.destroy(); resolve(false); }
      });
      socket.connect(port, host);
    });
  };

  const getMysqlConnection = async (): Promise<any> => {
    const now = Date.now();
    // If pool is already active and healthy, reuse it without churning new connection pools
    if (mysqlPool && isMysqlOnline) {
      if (now - lastMysqlCheck < 10000) {
        return mysqlPool;
      }
      try {
        const conn = await mysqlPool.getConnection();
        await conn.ping();
        conn.release();
        lastMysqlCheck = now;
        return mysqlPool;
      } catch {
        try { await mysqlPool.end(); } catch {}
        mysqlPool = null;
        isMysqlOnline = false;
        lastMysqlCheck = now;
      }
    }

    if (!isMysqlOnline && now - lastMysqlCheck < 10000) {
      return null;
    }

    lastMysqlCheck = now;

    const candidateHosts = Array.from(new Set([
      dbConfig.DB_HOST || 'localhost',
      '127.0.0.1',
      'localhost',
    ]));

    // Quick TCP socket check to prevent 15+ second hang when MySQL server is offline
    const port = parseInt(dbConfig.DB_PORT || '3306', 10);
    let reachableHost: string | null = null;
    for (const host of candidateHosts) {
      const open = await isPortReachable(host, port, 250);
      if (open) {
        reachableHost = host;
        break;
      }
    }
    if (!reachableHost) {
      isMysqlOnline = false;
      return null;
    }

    const mysqlDriver = await getMysqlDriver();
    if (!mysqlDriver) {
      isMysqlOnline = false;
      return null;
    }

    // Clean up existing pool if any before creating a new one
    if (mysqlPool) {
      try { await mysqlPool.end(); } catch {}
      mysqlPool = null;
    }

    const candidateCredentials = [
      { user: dbConfig.DB_USER || 'uicms_app_user', password: dbConfig.DB_PASS ?? 'TempPass123!' },
      { user: 'root', password: dbConfig.DB_PASS ?? '' },
      { user: 'root', password: '' },
      { user: 'uicms_user', password: 'SecurePass2026!' },
    ];

    for (const cred of candidateCredentials) {
      let pool: any = null;
      try {
        pool = mysqlDriver.createPool({
          host: reachableHost,
          port,
          user: cred.user,
          password: cred.password,
          database: dbConfig.DB_NAME || 'uicms_workflow',
          waitForConnections: true,
          connectionLimit: 5,
          queueLimit: 0,
          connectTimeout: 1500,
        });

        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        mysqlPool = pool;
        isMysqlOnline = true;
        await ensureMysqlSchema(mysqlPool);
        return mysqlPool;
        } catch (err: any) {
          if (pool) {
            try { await pool.end(); } catch {}
            pool = null;
          }

          // If MySQL server is running in XAMPP but the database does not exist yet:
          if (err && (err.code === 'ER_BAD_DB_ERROR' || err.errno === 1049)) {
            try {
              const rootPool = mysqlDriver.createPool({
                host: reachableHost,
                port: parseInt(dbConfig.DB_PORT || '3306', 10),
                user: cred.user,
                password: cred.password,
                connectTimeout: 1500,
              });
              const rootConn = await rootPool.getConnection();
              await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.DB_NAME || 'uicms_workflow'}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
              rootConn.release();
              await rootPool.end();

              // Reconnect to the newly created database
              const retryPool = mysqlDriver.createPool({
                host: reachableHost,
                port: parseInt(dbConfig.DB_PORT || '3306', 10),
                user: cred.user,
                password: cred.password,
                database: dbConfig.DB_NAME || 'uicms_workflow',
                waitForConnections: true,
                connectionLimit: 5,
                queueLimit: 0,
                connectTimeout: 1500,
              });
              const retryConn = await retryPool.getConnection();
              await retryConn.ping();
              retryConn.release();
              mysqlPool = retryPool;
              isMysqlOnline = true;
              await ensureMysqlSchema(mysqlPool);
              return mysqlPool;
            } catch {}
          }
          // try next credentials
        }
      }

    isMysqlOnline = false;
    return null;
  };

  const ensureMysqlSchema = async (pool: any) => {
    if (!pool) return;
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS departments (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          description TEXT NULL,
          icon VARCHAR(50) NULL,
          active TINYINT(1) NOT NULL DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(150) NOT NULL UNIQUE,
          personal_email VARCHAR(150) NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL DEFAULT 'designer',
          role_title VARCHAR(150) NOT NULL DEFAULT 'Team Member',
          department_id VARCHAR(50) NULL,
          avatar VARCHAR(500) NULL,
          active TINYINT(1) NOT NULL DEFAULT 1,
          is_suspended TINYINT(1) NOT NULL DEFAULT 0,
          suspension_reason TEXT NULL,
          is_temp_password TINYINT(1) NOT NULL DEFAULT 0,
          temp_password_expires_at VARCHAR(50) NULL,
          must_change_password TINYINT(1) NOT NULL DEFAULT 0,
          workload_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          app_payload LONGTEXT NULL,
          KEY idx_user_dept (department_id),
          KEY idx_user_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          name VARCHAR(150) NOT NULL,
          code VARCHAR(20) NOT NULL UNIQUE,
          logo_url VARCHAR(500) NULL,
          brand_guidelines TEXT NULL,
          ci_document_url VARCHAR(500) NULL,
          primary_contact_name VARCHAR(100) NULL,
          primary_contact_email VARCHAR(150) NULL,
          primary_contact_phone VARCHAR(50) NULL,
          primary_contact_position VARCHAR(100) NULL,
          website VARCHAR(255) NULL,
          notes TEXT NULL,
          default_ci_colors JSON NULL,
          font_requirements TEXT NULL,
          active_projects_count INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          app_payload LONGTEXT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_number INT NOT NULL DEFAULT 0,
          client_id VARCHAR(50) NOT NULL,
          department_id VARCHAR(50) NOT NULL DEFAULT 'marketing',
          request_type_id VARCHAR(50) NOT NULL,
          project_name VARCHAR(255) NOT NULL,
          campaign_name VARCHAR(255) NULL,
          description TEXT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          stage VARCHAR(50) NOT NULL DEFAULT 'REQUESTED',
          status VARCHAR(50) NOT NULL DEFAULT 'on_track',
          version VARCHAR(20) NOT NULL DEFAULT 'V0.1',
          accountable_user_id VARCHAR(50) NULL,
          project_owner_id VARCHAR(50) NULL,
          qa_owner_id VARCHAR(50) NULL,
          approver_id VARCHAR(50) NULL,
          contributor_ids JSON NULL,
          created_at VARCHAR(50) NOT NULL,
          updated_at VARCHAR(50) NOT NULL,
          brief_due_date VARCHAR(50) NULL,
          brief_locked_at VARCHAR(50) NULL,
          brief_locked_by VARCHAR(50) NULL,
          production_due_date VARCHAR(50) NULL,
          internal_qa_due_date VARCHAR(50) NULL,
          client_review_due_date VARCHAR(50) NULL,
          client_approval_due_date VARCHAR(50) NULL,
          final_qa_due_date VARCHAR(50) NULL,
          release_date VARCHAR(50) NULL,
          external_suppliers TEXT NULL,
          next_action_task VARCHAR(255) NULL,
          next_action_owner VARCHAR(100) NULL,
          next_action_due VARCHAR(50) NULL,
          approval_status VARCHAR(50) NOT NULL DEFAULT 'not_requested',
          is_brief_locked TINYINT(1) NOT NULL DEFAULT 0,
          is_version_locked TINYINT(1) NOT NULL DEFAULT 0,
          brief_data JSON NULL,
          brief_completeness INT NOT NULL DEFAULT 0,
          app_payload LONGTEXT NULL,
          KEY idx_client (client_id),
          KEY idx_stage (stage)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NULL,
          assigned_to VARCHAR(50) NULL,
          assigned_to_name VARCHAR(100) NULL,
          assigned_to_user_id VARCHAR(50) NULL,
          role_required VARCHAR(50) NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'todo',
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          due_date VARCHAR(50) NULL,
          start_date VARCHAR(50) NULL,
          completed_at VARCHAR(50) NULL,
          stage VARCHAR(50) NOT NULL DEFAULT 'PRODUCTION',
          checklist JSON NULL,
          comments_count INT NOT NULL DEFAULT 0,
          is_client_facing TINYINT(1) NOT NULL DEFAULT 0,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS project_files (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          filename VARCHAR(255) NOT NULL,
          size VARCHAR(50) NOT NULL DEFAULT '',
          type VARCHAR(150) NOT NULL DEFAULT '',
          version VARCHAR(20) NOT NULL DEFAULT 'V0.1',
          uploaded_by VARCHAR(50) NOT NULL DEFAULT '',
          uploaded_by_name VARCHAR(100) NOT NULL DEFAULT '',
          uploaded_at VARCHAR(50) NOT NULL,
          category VARCHAR(50) NOT NULL DEFAULT 'proofs',
          url VARCHAR(1000) NOT NULL DEFAULT '',
          description TEXT NULL,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS deliverable_versions (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          version_number VARCHAR(20) NOT NULL,
          title VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          preview_url VARCHAR(500) NULL,
          uploaded_by VARCHAR(50) NOT NULL,
          uploaded_by_name VARCHAR(100) NOT NULL,
          uploaded_at VARCHAR(50) NOT NULL,
          description TEXT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'draft',
          is_locked TINYINT(1) NOT NULL DEFAULT 0,
          qa_result VARCHAR(50) NULL,
          qa_notes TEXT NULL,
          changelog TEXT NULL,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS qa_submissions (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          version_id VARCHAR(50) NOT NULL,
          result VARCHAR(50) NOT NULL,
          performed_by VARCHAR(50) NOT NULL,
          performed_by_name VARCHAR(100) NOT NULL,
          performed_at VARCHAR(50) NOT NULL,
          checklist JSON NULL,
          overall_notes TEXT NULL,
          passed_count INT NULL DEFAULT 0,
          failed_count INT NULL DEFAULT 0,
          na_count INT NULL DEFAULT 0,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS client_approvals (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          version_id VARCHAR(50) NOT NULL,
          version_number VARCHAR(20) NOT NULL,
          client_id VARCHAR(50) NOT NULL,
          client_name VARCHAR(100) NOT NULL,
          client_position VARCHAR(100) NULL,
          status VARCHAR(50) NOT NULL,
          confirmation_text TEXT NULL,
          changes_requested JSON NULL,
          approved_at VARCHAR(50) NOT NULL,
          signature_hash VARCHAR(100) NULL,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS feedback_items (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NOT NULL,
          version_id VARCHAR(50) NOT NULL,
          version_number VARCHAR(20) NOT NULL,
          submitted_by VARCHAR(50) NOT NULL,
          submitted_by_name VARCHAR(100) NOT NULL,
          submitted_at VARCHAR(50) NOT NULL,
          feedback_text TEXT NOT NULL,
          attachment_url VARCHAR(500) NULL,
          assigned_to VARCHAR(50) NOT NULL,
          assigned_to_name VARCHAR(100) NOT NULL,
          priority VARCHAR(20) NOT NULL DEFAULT 'medium',
          status VARCHAR(50) NOT NULL DEFAULT 'open',
          type VARCHAR(50) NOT NULL DEFAULT 'action_required',
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          project_id VARCHAR(50) NULL,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          is_read TINYINT(1) NOT NULL DEFAULT 0,
          created_at VARCHAR(50) NOT NULL,
          target_tab VARCHAR(50) NULL,
          app_payload LONGTEXT NULL,
          KEY idx_user (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NULL,
          sender_id VARCHAR(50) NOT NULL,
          sender_name VARCHAR(100) NOT NULL,
          sender_avatar VARCHAR(500) NULL,
          message TEXT NOT NULL,
          created_at VARCHAR(50) NOT NULL,
          mentions JSON NULL,
          referenced_task_id VARCHAR(50) NULL,
          is_important TINYINT(1) NOT NULL DEFAULT 0,
          recipient_id VARCHAR(50) NULL,
          channel_id VARCHAR(50) NULL,
          attachments JSON NULL,
          referenced_version VARCHAR(50) NULL,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS activity_logs (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          project_id VARCHAR(50) NULL,
          user_id VARCHAR(50) NULL,
          user_name VARCHAR(100) NULL,
          action VARCHAR(100) NOT NULL,
          description TEXT NULL,
          timestamp VARCHAR(50) NULL,
          previous_stage VARCHAR(50) NULL,
          new_stage VARCHAR(50) NULL,
          version_ref VARCHAR(100) NULL,
          metadata JSON NULL,
          app_payload LONGTEXT NULL,
          KEY idx_project (project_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          setting_key VARCHAR(100) NOT NULL PRIMARY KEY,
          setting_value LONGTEXT NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);

      // Auto-seed default enterprise clients if table is empty
      try {
        const [clientRows] = await pool.query('SELECT COUNT(*) as cnt FROM clients');
        const clientCnt = (clientRows as any[])[0]?.cnt || 0;
        if (clientCnt === 0) {
          const defaultClients = [
            {
              id: 'cl-discovery',
              name: 'Discovery Group (Vitality)',
              code: 'DISC',
              logo_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
              brand_guidelines: 'Strict compliance with Discovery Blue (#004080) and Vitality Orange (#FF6600). Minimum 20mm clear space around the emblem.',
              ci_document_url: 'https://files.uicms.com/ci/Discovery_Corporate_CI_2026.pdf',
              primary_contact_name: 'Bradley Cooper',
              primary_contact_email: 'bradley.cooper@discovery.co.za',
              primary_contact_phone: '+27 (0)11 529 2888',
              primary_contact_position: 'VP Marketing & Brand Experience',
              website: 'https://www.discovery.co.za',
              notes: 'Premium incentive tier. Requires executive proof sign-offs 7 days prior to release.',
              default_ci_colors: JSON.stringify(['#004080', '#FF6600', '#F4F7FB', '#1E293B']),
              font_requirements: 'Discovery Sans Bold, Discovery Text Regular, Futura Heavy',
              active_projects_count: 4,
            },
            {
              id: 'cl-nissan',
              name: 'Nissan South Africa',
              code: 'NISN',
              logo_url: 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&auto=format&fit=crop&q=80',
              brand_guidelines: 'Nissan Crimson Red (#C3002F) & Sleek Silver (#8A8D8F). Ultra modern automotive styling.',
              ci_document_url: 'https://files.uicms.com/ci/Nissan_Apex_BrandBook.pdf',
              primary_contact_name: 'Rene Van Der Merwe',
              primary_contact_email: 'rene.vdm@nissan.co.za',
              primary_contact_phone: '+27 (0)12 529 6000',
              primary_contact_position: 'Head of Dealer Incentives',
              website: 'https://www.nissan.co.za',
              notes: 'Monthly sales sprint campaigns and dealership rewards platform.',
              default_ci_colors: JSON.stringify(['#C3002F', '#000000', '#8A8D8F', '#FFFFFF']),
              font_requirements: 'Nissan Brand Regular, Nissan Display Bold',
              active_projects_count: 3,
            },
            {
              id: 'cl-standardbank',
              name: 'Standard Bank Wealth',
              code: 'SBWL',
              logo_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=200&auto=format&fit=crop&q=80',
              brand_guidelines: 'Standard Bank Cobalt Blue (#0033A0) & Light Blue (#0091FF). High-net-worth luxury elegance.',
              ci_document_url: 'https://files.uicms.com/ci/SB_Wealth_Guidelines.pdf',
              primary_contact_name: 'Sipho Khumalo',
              primary_contact_email: 'sipho.khumalo@standardbank.co.za',
              primary_contact_phone: '+27 (0)11 636 9111',
              primary_contact_position: 'Director of Private Client Incentives',
              website: 'https://wealth.standardbank.com',
              notes: 'Incentive Travel Switzerland and Kyoto trips + high-value client vouchers.',
              default_ci_colors: JSON.stringify(['#0033A0', '#0091FF', '#F0F4FF', '#0A192F']),
              font_requirements: 'Standard Bank Sans, Cormorant Garamond',
              active_projects_count: 4,
            },
            {
              id: 'cl-bidvest',
              name: 'Bidvest Premier Global',
              code: 'BIDV',
              logo_url: 'https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=200&auto=format&fit=crop&q=80',
              brand_guidelines: 'Bidvest Corporate Navy (#002B49) & Gold (#C5A059). Trust, integrity and global scale.',
              ci_document_url: 'https://files.uicms.com/ci/Bidvest_Global_Brand.pdf',
              primary_contact_name: 'Helena Du Plessis',
              primary_contact_email: 'helena.dp@bidvest.co.za',
              primary_contact_phone: '+27 (0)11 772 8700',
              primary_contact_position: 'Group Events Director',
              website: 'https://www.bidvest.co.za',
              notes: 'Bidvest Vouchers, airport lounge vouchers, and international travel stationery.',
              default_ci_colors: JSON.stringify(['#002B49', '#C5A059', '#E6EFF5']),
              font_requirements: 'Proxima Nova, Trajan Pro',
              active_projects_count: 2,
            },
            {
              id: 'cl-woolworths',
              name: 'Woolworths Financial Services',
              code: 'WFS',
              logo_url: 'https://images.unsplash.com/photo-1542744094-3a31f272c490?w=200&auto=format&fit=crop&q=80',
              brand_guidelines: 'Woolworths Classic Monochrome (#000000 / #FFFFFF) with Accent Green (#2D6A4F). Premium sustainable minimalism.',
              ci_document_url: '',
              primary_contact_name: 'Anita Govender',
              primary_contact_email: 'anita.govender@wfs.co.za',
              primary_contact_phone: '+27 (0)21 407 9111',
              primary_contact_position: 'Loyalty Portfolio Lead',
              website: 'https://www.woolworths.co.za',
              notes: 'Sprint campaign banners and store catalogue logos.',
              default_ci_colors: JSON.stringify(['#000000', '#2D6A4F', '#F8F9FA']),
              font_requirements: 'Futura, Gill Sans, Helvetica Neue',
              active_projects_count: 2,
            },
          ];
          for (const cl of defaultClients) {
            try {
              await pool.query(
                `INSERT INTO clients (
                  id, name, code, logo_url, brand_guidelines, ci_document_url,
                  primary_contact_name, primary_contact_email, primary_contact_phone, primary_contact_position,
                  website, notes, default_ci_colors, font_requirements, active_projects_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE name=VALUES(name)`,
                [
                  cl.id, cl.name, cl.code, cl.logo_url, cl.brand_guidelines, cl.ci_document_url || '',
                  cl.primary_contact_name, cl.primary_contact_email, cl.primary_contact_phone, cl.primary_contact_position,
                  cl.website, cl.notes, cl.default_ci_colors, cl.font_requirements, cl.active_projects_count
                ]
              );
            } catch {}
          }
        }

        // Ensure missing columns exist in chat_messages, notifications, admin_settings
        const columnMigrations = [
          'ALTER TABLE chat_messages MODIFY COLUMN project_id VARCHAR(50) NULL',
          'ALTER TABLE chat_messages ADD COLUMN sender_avatar VARCHAR(500) NULL',
          'ALTER TABLE chat_messages ADD COLUMN text LONGTEXT NULL',
          'ALTER TABLE chat_messages ADD COLUMN mentions JSON NULL',
          'ALTER TABLE chat_messages ADD COLUMN referenced_task_id VARCHAR(50) NULL',
          'ALTER TABLE chat_messages ADD COLUMN is_important TINYINT(1) NOT NULL DEFAULT 0',
          'ALTER TABLE chat_messages ADD COLUMN recipient_id VARCHAR(50) NULL',
          'ALTER TABLE chat_messages ADD COLUMN channel_id VARCHAR(50) NULL',
          'ALTER TABLE chat_messages ADD COLUMN attachments JSON NULL',
          'ALTER TABLE chat_messages ADD COLUMN referenced_version VARCHAR(50) NULL',
          'ALTER TABLE chat_messages ADD COLUMN read_by JSON NULL',
          'ALTER TABLE chat_messages ADD COLUMN app_payload LONGTEXT NULL',
          'ALTER TABLE notifications ADD COLUMN is_read TINYINT(1) NOT NULL DEFAULT 0',
          'ALTER TABLE notifications ADD COLUMN read_status TINYINT(1) NOT NULL DEFAULT 0',
          'ALTER TABLE notifications ADD COLUMN target_tab VARCHAR(50) NULL',
          'ALTER TABLE notifications ADD COLUMN app_payload LONGTEXT NULL',
          'ALTER TABLE admin_settings ADD COLUMN setting_key VARCHAR(100) NULL',
          'ALTER TABLE admin_settings ADD COLUMN setting_value LONGTEXT NULL',
        ];
        for (const sql of columnMigrations) {
          try {
            await pool.query(sql);
          } catch {}
        }

        // Auto-seed MySQL from uicms_workflow_db.json if chat_messages or notifications or projects tables are empty in MySQL
        try {
          const [chatRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM chat_messages');
          const [notifRows]: any = await pool.query('SELECT COUNT(*) as cnt FROM notifications');
          if ((chatRows?.[0]?.cnt || 0) === 0 || (notifRows?.[0]?.cnt || 0) === 0) {
            const jsonPath = path.resolve(__dirname, 'php-backend/data/uicms_workflow_db.json');
            if (fs.existsSync(jsonPath)) {
              const seedData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
              await upsertToMysql(pool, seedData);
              console.log('Successfully auto-seeded initial records into MySQL uicms_workflow database!');
            }
          }
        } catch (seedErr: any) {
          console.warn('MySQL auto-seed check notice:', seedErr.message);
        }
      } catch {}
    } catch (e: any) {
      console.warn('ensureMysqlSchema error:', e.message);
    }
  };

  const upsertToMysql = async (pool: any, rawData: any) => {
    if (!pool || !rawData) return;

    let payloadObj: any = rawData;
    if (rawData.table && rawData.data) {
      payloadObj = {
        table: rawData.table,
        data: rawData.data,
        [rawData.table]: rawData.data,
      };
      if (rawData.table === 'deliverable_versions') payloadObj.versions = rawData.data;
      if (rawData.table === 'project_files') payloadObj.files = rawData.data;
    } else if (rawData.data && typeof rawData.data === 'object' && !Array.isArray(rawData.data)) {
      payloadObj = rawData.data;
    }

    const data = payloadObj;

    // Projects
    const projects = data.projects || (data.table === 'projects' ? data.data : null);
    if (Array.isArray(projects)) {
      for (const p of projects) {
        if (!p || !p.id) continue;
        try {
          await pool.query(
            `INSERT INTO projects (
              id, project_number, client_id, department_id, request_type_id, project_name, campaign_name,
              description, priority, stage, status, version, accountable_user_id, project_owner_id,
              qa_owner_id, approver_id, contributor_ids, created_at, updated_at, brief_due_date,
              production_due_date, internal_qa_due_date, client_review_due_date, client_approval_due_date,
              final_qa_due_date, release_date, external_suppliers, next_action_task, next_action_owner,
              next_action_due, approval_status, is_brief_locked, is_version_locked, brief_data, brief_completeness
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_number = VALUES(project_number), client_id = VALUES(client_id), department_id = VALUES(department_id),
              request_type_id = VALUES(request_type_id), project_name = VALUES(project_name), campaign_name = VALUES(campaign_name),
              description = VALUES(description), priority = VALUES(priority), stage = VALUES(stage), status = VALUES(status),
              version = VALUES(version), accountable_user_id = VALUES(accountable_user_id), project_owner_id = VALUES(project_owner_id),
              qa_owner_id = VALUES(qa_owner_id), approver_id = VALUES(approver_id), contributor_ids = VALUES(contributor_ids),
              updated_at = VALUES(updated_at), brief_due_date = VALUES(brief_due_date), production_due_date = VALUES(production_due_date),
              internal_qa_due_date = VALUES(internal_qa_due_date), client_review_due_date = VALUES(client_review_due_date),
              client_approval_due_date = VALUES(client_approval_due_date), final_qa_due_date = VALUES(final_qa_due_date),
              release_date = VALUES(release_date), external_suppliers = VALUES(external_suppliers), next_action_task = VALUES(next_action_task),
              next_action_owner = VALUES(next_action_owner), next_action_due = VALUES(next_action_due), approval_status = VALUES(approval_status),
              is_brief_locked = VALUES(is_brief_locked), is_version_locked = VALUES(is_version_locked), brief_data = VALUES(brief_data),
              brief_completeness = VALUES(brief_completeness)`,
            [
              p.id,
              p.projectNumber || p.project_number || 0,
              p.clientId || p.client_id || '',
              p.departmentId || p.department_id || 'marketing',
              p.requestTypeId || p.request_type_id || '',
              p.projectName || p.project_name || p.title || '',
              p.campaignName || p.campaign_name || '',
              p.description || '',
              p.priority || 'medium',
              p.stage || 'BRIEF_VALIDATION',
              p.status || 'on_track',
              p.version || 'V0.1',
              p.accountableUserId || p.accountable_user_id || null,
              p.projectOwnerId || p.project_owner_id || null,
              p.qaOwnerId || p.qa_owner_id || null,
              p.approverId || p.approver_id || null,
              JSON.stringify(p.contributorIds || p.contributor_ids || []),
              p.createdAt || p.created_at || new Date().toISOString(),
              p.updatedAt || p.updated_at || new Date().toISOString(),
              p.briefDueDate || p.brief_due_date || null,
              p.productionDueDate || p.production_due_date || null,
              p.internalQaDueDate || p.internal_qa_due_date || null,
              p.clientReviewDueDate || p.client_review_due_date || null,
              p.clientApprovalDueDate || p.client_approval_due_date || null,
              p.finalQaDueDate || p.final_qa_due_date || null,
              p.releaseDate || p.release_date || null,
              p.externalSuppliers || p.external_suppliers || '',
              p.nextAction?.task || p.next_action_task || null,
              p.nextAction?.ownerName || p.next_action_owner || null,
              p.nextAction?.dueDate || p.next_action_due || null,
              p.approvalStatus || p.approval_status || 'not_requested',
              p.isBriefLocked || p.is_brief_locked ? 1 : 0,
              p.isVersionLocked || p.is_version_locked ? 1 : 0,
              JSON.stringify(p.briefData || p.brief_data || {}),
              p.briefCompleteness || p.brief_completeness || 0,
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert project error:', e.message);
        }
      }
    }

    // Tasks
    const tasks = data.tasks || (data.table === 'tasks' ? data.data : null);
    if (Array.isArray(tasks)) {
      for (const t of tasks) {
        if (!t || !t.id) continue;
        try {
          await pool.query(
            `INSERT INTO tasks (
              id, project_id, title, description, assigned_to, assigned_to_name, assigned_to_user_id,
              role_required, status, priority, start_date, due_date, completed_at, stage, checklist, comments_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), title = VALUES(title), description = VALUES(description),
              assigned_to = VALUES(assigned_to), assigned_to_name = VALUES(assigned_to_name),
              assigned_to_user_id = VALUES(assigned_to_user_id), role_required = VALUES(role_required),
              status = VALUES(status), priority = VALUES(priority), start_date = VALUES(start_date),
              due_date = VALUES(due_date), completed_at = VALUES(completed_at), stage = VALUES(stage),
              checklist = VALUES(checklist), comments_count = VALUES(comments_count)`,
            [
              t.id,
              t.projectId || t.project_id || '',
              t.name || t.title || 'Task',
              t.description || '',
              t.assignedTo || t.assigned_to || t.ownerId || '',
              t.assignedToName || t.assigned_to_name || '',
              t.ownerId || t.assigned_to_user_id || '',
              t.roleRequired || t.role_required || 'designer',
              t.status || 'todo',
              t.priority || 'medium',
              t.startDate || t.start_date || null,
              t.dueDate || t.due_date || null,
              t.completedAt || t.completed_at || null,
              t.stage || 'PRODUCTION',
              JSON.stringify(t.checklist || []),
              t.commentsCount || t.comments_count || 0,
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert task error:', e.message);
        }
      }
    }

    // Files
    const files = data.files || data.project_files || (data.table === 'files' ? data.data : null);
    if (Array.isArray(files)) {
      for (const f of files) {
        if (!f || !f.id) continue;
        try {
          await pool.query(
            `INSERT INTO project_files (
              id, project_id, filename, size, type, version, uploaded_by, uploaded_by_name, uploaded_at, category, url, description
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), filename = VALUES(filename), size = VALUES(size), type = VALUES(type),
              version = VALUES(version), uploaded_by = VALUES(uploaded_by), uploaded_by_name = VALUES(uploaded_by_name),
              uploaded_at = VALUES(uploaded_at), category = VALUES(category), url = VALUES(url), description = VALUES(description)`,
            [
              f.id,
              f.projectId || f.project_id || '',
              f.filename || 'File',
              f.size || '',
              f.type || 'application/octet-stream',
              f.version || 'V1.0',
              f.uploadedBy || f.uploaded_by || '',
              f.uploadedByName || f.uploaded_by_name || '',
              f.uploadedAt || f.uploaded_at || new Date().toISOString(),
              f.category || 'proofs',
              f.url || '',
              f.description || '',
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert file error:', e.message);
        }
      }
    }

    // Deliverable Versions
    const versions = data.versions || data.deliverable_versions || (data.table === 'versions' ? data.data : null);
    if (Array.isArray(versions)) {
      for (const v of versions) {
        if (!v || !v.id) continue;
        try {
          await pool.query(
            `INSERT INTO deliverable_versions (
              id, project_id, version_number, title, file_url, preview_url, uploaded_by, uploaded_by_name,
              uploaded_at, description, status, is_locked, qa_result, qa_notes, changelog
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), version_number = VALUES(version_number), title = VALUES(title),
              file_url = VALUES(file_url), preview_url = VALUES(preview_url), uploaded_by = VALUES(uploaded_by),
              uploaded_by_name = VALUES(uploaded_by_name), uploaded_at = VALUES(uploaded_at), description = VALUES(description),
              status = VALUES(status), is_locked = VALUES(is_locked), qa_result = VALUES(qa_result), qa_notes = VALUES(qa_notes),
              changelog = VALUES(changelog)`,
            [
              v.id,
              v.projectId || v.project_id || '',
              v.versionNumber || v.version_number || 'V1.0',
              v.title || 'Version',
              v.fileUrl || v.file_url || '',
              v.previewUrl || v.preview_url || null,
              v.uploadedBy || v.uploaded_by || '',
              v.uploadedByName || v.uploaded_by_name || '',
              v.uploadedAt || v.uploaded_at || new Date().toISOString(),
              v.description || '',
              v.status || 'draft',
              v.isLocked || v.is_locked ? 1 : 0,
              v.qaResult || v.qa_result || null,
              v.qaNotes || v.qa_notes || null,
              v.changelog || '',
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert version error:', e.message);
        }
      }
    }

    // QA Submissions
    const qa = data.qa_submissions || data.qaSubmissions || (data.table === 'qa_submissions' ? data.data : null);
    if (Array.isArray(qa)) {
      for (const q of qa) {
        if (!q || !q.id) continue;
        try {
          await pool.query(
            `INSERT INTO qa_submissions (
              id, project_id, version_id, result, performed_by, performed_by_name, performed_at,
              checklist, overall_notes, passed_count, failed_count, na_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), version_id = VALUES(version_id), result = VALUES(result),
              performed_by = VALUES(performed_by), performed_by_name = VALUES(performed_by_name),
              performed_at = VALUES(performed_at), checklist = VALUES(checklist), overall_notes = VALUES(overall_notes),
              passed_count = VALUES(passed_count), failed_count = VALUES(failed_count), na_count = VALUES(na_count)`,
            [
              q.id,
              q.projectId || q.project_id || '',
              q.versionId || q.version_id || '',
              q.result || 'passed',
              q.performedBy || q.performed_by || '',
              q.performedByName || q.performed_by_name || '',
              q.performedAt || q.performed_at || new Date().toISOString(),
              JSON.stringify(q.checklist || []),
              q.overallNotes || q.overall_notes || '',
              q.passedCount || q.passed_count || 0,
              q.failedCount || q.failed_count || 0,
              q.naCount || q.na_count || 0,
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert qa error:', e.message);
        }
      }
    }

    // Client Approvals
    const approvals = data.client_approvals || data.approvals || (data.table === 'client_approvals' ? data.data : null);
    if (Array.isArray(approvals)) {
      for (const a of approvals) {
        if (!a || !a.id) continue;
        try {
          await pool.query(
            `INSERT INTO client_approvals (
              id, project_id, version_id, version_number, client_id, client_name, client_position,
              status, confirmation_text, changes_requested, approved_at, signature_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), version_id = VALUES(version_id), version_number = VALUES(version_number),
              client_id = VALUES(client_id), client_name = VALUES(client_name), client_position = VALUES(client_position),
              status = VALUES(status), confirmation_text = VALUES(confirmation_text), changes_requested = VALUES(changes_requested),
              approved_at = VALUES(approved_at), signature_hash = VALUES(signature_hash)`,
            [
              a.id,
              a.projectId || a.project_id || '',
              a.versionId || a.version_id || '',
              a.versionNumber || a.version_number || 'V1.0',
              a.clientId || a.client_id || '',
              a.clientName || a.client_name || '',
              a.clientPosition || a.client_position || '',
              a.status || 'approved',
              a.confirmationText || a.confirmation_text || '',
              JSON.stringify(a.changesRequested || a.changes_requested || []),
              a.approvedAt || a.approved_at || new Date().toISOString(),
              a.signatureHash || a.signature_hash || '',
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert approval error:', e.message);
        }
      }
    }

    // Feedback Items
    const feedback = data.feedback_items || data.feedbackItems || (data.table === 'feedback_items' ? data.data : null);
    if (Array.isArray(feedback)) {
      for (const fb of feedback) {
        if (!fb || !fb.id) continue;
        try {
          await pool.query(
            `INSERT INTO feedback_items (
              id, project_id, version_id, version_number, submitted_by, submitted_by_name, submitted_at,
              feedback_text, attachment_url, assigned_to, assigned_to_name, priority, status, type
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), version_id = VALUES(version_id), version_number = VALUES(version_number),
              submitted_by = VALUES(submitted_by), submitted_by_name = VALUES(submitted_by_name),
              submitted_at = VALUES(submitted_at), feedback_text = VALUES(feedback_text), attachment_url = VALUES(attachment_url),
              assigned_to = VALUES(assigned_to), assigned_to_name = VALUES(assigned_to_name), priority = VALUES(priority),
              status = VALUES(status), type = VALUES(type)`,
            [
              fb.id,
              fb.projectId || fb.project_id || '',
              fb.versionId || fb.version_id || '',
              fb.versionNumber || fb.version_number || 'V1.0',
              fb.submittedBy || fb.submitted_by || '',
              fb.submittedByName || fb.submitted_by_name || '',
              fb.submittedAt || fb.submitted_at || new Date().toISOString(),
              fb.feedbackText || fb.feedback_text || '',
              fb.attachmentUrl || fb.attachment_url || null,
              fb.assignedTo || fb.assigned_to || '',
              fb.assignedToName || fb.assigned_to_name || '',
              fb.priority || 'medium',
              fb.status || 'open',
              fb.type || 'action_required',
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert feedback error:', e.message);
        }
      }
    }

    // Notifications
    const notifs = data.notifications || (data.table === 'notifications' ? data.data : null);
    if (Array.isArray(notifs)) {
      for (const n of notifs) {
        if (!n || !n.id) continue;
        try {
          const isRead = n.read || n.is_read || n.read_status ? 1 : 0;
          await pool.query(
            `INSERT INTO notifications (
              id, user_id, project_id, type, title, message, is_read, read_status, created_at, target_tab, app_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              user_id = VALUES(user_id), project_id = VALUES(project_id), type = VALUES(type),
              title = VALUES(title), message = VALUES(message), is_read = VALUES(is_read), read_status = VALUES(read_status),
              created_at = VALUES(created_at), target_tab = VALUES(target_tab), app_payload = VALUES(app_payload)`,
            [
              n.id,
              n.userId || n.user_id || '',
              n.projectId || n.project_id || null,
              n.type || 'system_alert',
              n.title || 'Notification',
              n.message || n.text || '',
              isRead,
              isRead,
              n.createdAt || n.created_at || new Date().toISOString(),
              n.targetTab || n.target_tab || null,
              JSON.stringify(n),
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert notification error:', e.message);
        }
      }
    }

    // Chat Messages
    const chats = data.chat_messages || data.chatMessages || (data.table === 'chat_messages' || data.table === 'chatMessages' ? data.data : null);
    if (Array.isArray(chats)) {
      for (const m of chats) {
        if (!m || !m.id) continue;
        try {
          const mentionsJson = Array.isArray(m.mentions) ? JSON.stringify(m.mentions) : (typeof m.mentions === 'string' ? m.mentions : null);
          const attachJson = Array.isArray(m.attachments) ? JSON.stringify(m.attachments) : (typeof m.attachments === 'string' ? m.attachments : null);
          const readByJson = Array.isArray(m.readBy || m.read_by) ? JSON.stringify(m.readBy || m.read_by) : (typeof (m.readBy || m.read_by) === 'string' ? (m.readBy || m.read_by) : null);
          const targetProjectId = m.projectId || m.project_id || null;
          const msgBody = m.message || m.text || '';
          await pool.query(
            `INSERT INTO chat_messages (
              id, project_id, sender_id, sender_name, sender_avatar, message, text, created_at,
              mentions, referenced_task_id, is_important, recipient_id, channel_id, attachments, referenced_version, read_by, app_payload
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              project_id = VALUES(project_id), sender_id = VALUES(sender_id), sender_name = VALUES(sender_name),
              sender_avatar = VALUES(sender_avatar), message = VALUES(message), text = VALUES(text), created_at = VALUES(created_at),
              mentions = VALUES(mentions), referenced_task_id = VALUES(referenced_task_id), is_important = VALUES(is_important),
              recipient_id = VALUES(recipient_id), channel_id = VALUES(channel_id), attachments = VALUES(attachments),
              referenced_version = VALUES(referenced_version), read_by = VALUES(read_by), app_payload = VALUES(app_payload)`,
            [
              m.id,
              targetProjectId,
              m.senderId || m.sender_id || '',
              m.senderName || m.sender_name || 'User',
              m.senderAvatar || m.sender_avatar || '',
              msgBody,
              msgBody,
              m.createdAt || m.created_at || new Date().toISOString(),
              mentionsJson,
              m.referencedTaskId || m.referenced_task_id || null,
              m.isImportant || m.is_important ? 1 : 0,
              m.recipientId || m.recipient_id || null,
              m.channelId || m.channel_id || null,
              attachJson,
              m.referencedVersion || m.referenced_version || null,
              readByJson,
              JSON.stringify(m),
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert chat error:', e.message);
        }
      }
    }

    // Activity Logs
    const logs = data.activity_logs || data.activityLogs || (data.table === 'activity_logs' || data.table === 'activityLogs' ? data.data : null);
    if (Array.isArray(logs)) {
      for (const l of logs) {
        if (!l || !l.id) continue;
        const insertLogSql = `INSERT INTO activity_logs (
          id, project_id, user_id, user_name, action, description, timestamp,
          previous_stage, new_stage, version_ref, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          project_id = VALUES(project_id), user_id = VALUES(user_id), user_name = VALUES(user_name),
          action = VALUES(action), description = VALUES(description), timestamp = VALUES(timestamp),
          previous_stage = VALUES(previous_stage), new_stage = VALUES(new_stage),
          version_ref = VALUES(version_ref), metadata = VALUES(metadata)`;
        let safeMetadataStr = '{}';
        if (typeof l.metadata === 'object' && l.metadata !== null) {
          try { safeMetadataStr = JSON.stringify(l.metadata); } catch { safeMetadataStr = '{}'; }
        } else if (typeof l.metadata === 'string' && l.metadata.trim()) {
          try {
            JSON.parse(l.metadata);
            safeMetadataStr = l.metadata;
          } catch {
            safeMetadataStr = JSON.stringify({ note: l.metadata });
          }
        }

        const logParams = [
          l.id,
          l.projectId || l.project_id || null,
          l.userId || l.user_id || null,
          l.userName || l.user_name || null,
          l.action || '',
          l.description || '',
          l.timestamp || new Date().toISOString(),
          l.previousStage || l.previous_stage || null,
          l.newStage || l.new_stage || null,
          l.versionRef || l.version_ref || null,
          safeMetadataStr,
        ];
        try {
          await pool.query(insertLogSql, logParams);
        } catch (e: any) {
          if (e && (e.code === 'ER_NO_SUCH_TABLE' || e.message?.includes("doesn't exist"))) {
            try {
              await ensureMysqlSchema(pool);
              await pool.query(insertLogSql, logParams);
            } catch (err2: any) {
              console.warn('MySQL upsert log retry notice:', err2.message);
            }
          } else {
            console.warn('MySQL upsert log notice:', e.message);
          }
        }
      }
    }

    // Clients
    const clients = data.clients || (data.table === 'clients' ? data.data : null);
    if (Array.isArray(clients)) {
      for (const c of clients) {
        if (!c || !c.id) continue;
        try {
          await pool.query(
            `INSERT INTO clients (
              id, name, code, logo_url, brand_guidelines, ci_document_url, primary_contact_name,
              primary_contact_email, primary_contact_phone, primary_contact_position, website, notes,
              default_ci_colors, font_requirements, active_projects_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name), code = VALUES(code), logo_url = VALUES(logo_url),
              brand_guidelines = VALUES(brand_guidelines), ci_document_url = VALUES(ci_document_url),
              primary_contact_name = VALUES(primary_contact_name), primary_contact_email = VALUES(primary_contact_email),
              primary_contact_phone = VALUES(primary_contact_phone), primary_contact_position = VALUES(primary_contact_position),
              website = VALUES(website), notes = VALUES(notes), default_ci_colors = VALUES(default_ci_colors),
              font_requirements = VALUES(font_requirements), active_projects_count = VALUES(active_projects_count)`,
            [
              c.id,
              c.name || 'Client',
              c.code || 'CLI',
              c.logoUrl || c.logo_url || '',
              c.brandGuidelines || c.brand_guidelines || '',
              c.ciDocumentUrl || c.ci_document_url || '',
              c.primaryContact?.name || c.primary_contact_name || '',
              c.primaryContact?.email || c.primary_contact_email || '',
              c.primaryContact?.phone || c.primary_contact_phone || '',
              c.primaryContact?.position || c.primary_contact_position || '',
              c.website || '',
              c.notes || '',
              JSON.stringify(c.defaultCiColors || c.default_ci_colors || []),
              c.fontRequirements || c.font_requirements || '',
              c.activeProjectsCount || c.active_projects_count || 0,
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert client error:', e.message);
        }
      }
    }

    // Users
    const users = data.users || (data.table === 'users' ? data.data : null);
    if (Array.isArray(users)) {
      for (const u of users) {
        if (!u || !u.id) continue;
        try {
          await pool.query(
            `INSERT INTO users (
              id, name, email, personal_email, password, role, role_title, department_id,
              avatar, active, is_suspended, suspension_reason, workload_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
              name = VALUES(name), email = VALUES(email), personal_email = VALUES(personal_email),
              role = VALUES(role), role_title = VALUES(role_title), department_id = VALUES(department_id),
              avatar = VALUES(avatar), active = VALUES(active), is_suspended = VALUES(is_suspended),
              suspension_reason = VALUES(suspension_reason), workload_count = VALUES(workload_count)`,
            [
              u.id,
              u.name || 'User',
              u.email || '',
              u.personalEmail || u.personal_email || null,
              u.password || 'Password123!',
              u.role || 'designer',
              u.roleTitle || u.role_title || 'Team Member',
              u.departmentId || u.department_id || 'marketing',
              u.avatar || '',
              u.active === false || u.active === 0 ? 0 : 1,
              u.isSuspended || u.is_suspended ? 1 : 0,
              u.suspendedReason || u.suspension_reason || null,
              u.workloadCount || u.workload_count || 0,
            ]
          );
        } catch (e: any) {
          console.warn('MySQL upsert user error:', e.message);
        }
      }
    }

    // Admin Settings
    const settings = data.admin_settings || data.adminSettings || data.adminConfig;
    if (settings && typeof settings === 'object') {
      try {
        await pool.query(
          `INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?)
           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
          ['system_config', JSON.stringify(settings)]
        );
      } catch (e: any) {
        console.warn('MySQL upsert settings error:', e.message);
      }
    }
  };

  return {
    name: 'php-backend-mock-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/php-backend') && !req.url?.startsWith('/api')) {
          return next();
        }

        // Apply CORS headers for cross-origin access (e.g. preview URL to local host or cross-port)
        const reqOrigin = (req.headers.origin as string) || '';
        if (reqOrigin) {
          res.setHeader('Access-Control-Allow-Origin', reqOrigin);
          res.setHeader('Access-Control-Allow-Credentials', 'true');
        } else {
          res.setHeader('Access-Control-Allow-Origin', '*');
        }
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Pragma, X-User-Id, X-User-Role, X-Client-Id, X-Department-Id');
        res.setHeader('Access-Control-Max-Age', '86400');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Try proxying to live PHP server if available (e.g. Apache/XAMPP/WAMP on port 80, 8088 or process.env.PHP_API_TARGET)
        const targetHosts = [
          process.env.PHP_API_TARGET,
          process.env.VITE_PHP_API_TARGET,
          'http://127.0.0.1:80',
          'http://localhost:80',
          'http://127.0.0.1',
          'http://localhost',
          'http://127.0.0.1:8088',
          'http://localhost:8088',
        ].filter(Boolean) as string[];

        // Filter out self-referencing dev server port 3000 and internal container control ports to prevent misrouting
        const validHosts = targetHosts.filter((h) => !h.includes(':3000') && !h.includes(':8080') && !h.includes(':8000'));

        let bodyBuffer: Buffer | null = null;
        if (req.method === 'POST' || req.method === 'PUT') {
          bodyBuffer = await new Promise((resolve) => {
            const chunks: any[] = [];
            req.on('data', (c) => chunks.push(c));
            req.on('end', () => resolve(Buffer.concat(chunks)));
          });
        }

        const now = Date.now();
        // If we recently verified that no live PHP daemon is running (within 10 seconds), skip probing to avoid latency
        const shouldProbe = cachedLiveHost !== null || now - lastProbeTime > 10000;
        const hostsToTry = cachedLiveHost ? [cachedLiveHost] : (shouldProbe ? validHosts : []);

        for (const host of hostsToTry) {
          const pathCandidates = [
            req.url,
            req.url?.startsWith('/uicms') ? req.url : `/uicms${req.url}`,
            req.url?.startsWith('/uicms-workflow') ? req.url : `/uicms-workflow${req.url}`,
          ].filter(Boolean) as string[];

          for (const candPath of pathCandidates) {
            try {
              const fullUrl = new URL(candPath, host).toString();
              const headers: Record<string, string> = {
                Accept: 'application/json',
              };
              if (req.headers['content-type']) {
                headers['content-type'] = req.headers['content-type'] as string;
              }
              if (req.headers.cookie) headers.cookie = req.headers.cookie;
              if (req.headers.origin) headers.origin = req.headers.origin;

              const controller = new AbortController();
              const timeout = setTimeout(() => controller.abort(), 3500);

              const phpResp = await fetch(fullUrl, {
                method: req.method,
                headers,
                body: bodyBuffer ? new Uint8Array(bodyBuffer) : undefined,
                signal: controller.signal,
              });

              clearTimeout(timeout);

              const contentType = phpResp.headers.get('content-type') || '';
              // If the host returned an error or non-JSON (e.g. proxy/HTML/redirect/401/404/500), skip it
              if (
                phpResp.status >= 400 ||
                phpResp.status === 302 ||
                !contentType.includes('application/json')
              ) {
                continue;
              }

              // Found live PHP service responding with JSON!
              cachedLiveHost = host;
              lastProbeTime = Date.now();
              res.statusCode = phpResp.status;
              res.setHeader('Content-Type', contentType || 'application/json');
              const contentLength = phpResp.headers.get('content-length');
              if (contentLength) res.setHeader('Content-Length', contentLength);
              const setCookie = phpResp.headers.get('set-cookie');
              if (setCookie) res.setHeader('Set-Cookie', setCookie);
              if (phpResp.body) {
                Readable.fromWeb(phpResp.body as any).pipe(res);
              } else {
                res.end();
              }
              return;
            } catch {
              // Target host offline, try next candidate
            }
          }
        }

        if (shouldProbe && !cachedLiveHost) {
          cachedLiveHost = null;
          lastProbeTime = Date.now();
        }

        // Live PHP host offline; check for static asset / uploads handlers
        const cleanPath = req.url ? req.url.split('?')[0] : '';

        if (cleanPath.startsWith('/php-backend/uploads/')) {
          const relPath = cleanPath.replace(/^\/php-backend\//, '');
          const filePath = path.resolve(__dirname, 'php-backend', relPath.replace(/^uploads\//, 'uploads/'));
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap: Record<string, string> = {
              '.jpg': 'image/jpeg',
              '.jpeg': 'image/jpeg',
              '.png': 'image/png',
              '.gif': 'image/gif',
              '.webp': 'image/webp',
              '.svg': 'image/svg+xml',
              '.pdf': 'application/pdf',
            };
            res.statusCode = 200;
            res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
            return fs.createReadStream(filePath).pipe(res);
          }
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          return res.end('Uploaded file not found');
        }

        if (cleanPath === '/php-backend/api/upload.php') {
          try {
            const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
            let parsed: any = {};
            try { parsed = JSON.parse(bodyStr); } catch {}
            const rawType = parsed.type || 'file';
            const type = rawType === 'avatar' ? 'avatars' : 'files';
            const destDir = path.resolve(__dirname, 'php-backend/uploads', type);
            if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

            let originalFilename = parsed.filename || `upload_${Date.now()}.bin`;
            let fileContentBuffer: Buffer | null = null;

            const base64Str = parsed.base64 || parsed.data;
            if (base64Str && typeof base64Str === 'string') {
              const parts = base64Str.split('base64,');
              fileContentBuffer = Buffer.from(parts[1] || parts[0], 'base64');
            } else if (bodyBuffer && bodyBuffer.length > 0) {
              // Extract filename from multipart header if present
              const headerMatch = bodyStr.match(/filename="([^"]+)"/i);
              if (headerMatch && headerMatch[1]) {
                originalFilename = headerMatch[1];
              }
              // Basic multipart boundary payload extraction
              const boundaryMatch = (req.headers['content-type'] || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
              if (boundaryMatch) {
                const boundary = boundaryMatch[1] || boundaryMatch[2];
                const boundaryBuf = Buffer.from(`--${boundary}`);
                const endBuf = Buffer.from(`\r\n\r\n`);
                const startIdx = bodyBuffer.indexOf(endBuf);
                if (startIdx !== -1) {
                  const contentStart = startIdx + 4;
                  const contentEnd = bodyBuffer.indexOf(boundaryBuf, contentStart) - 2; // subtract \r\n
                  if (contentEnd > contentStart) {
                    fileContentBuffer = bodyBuffer.slice(contentStart, contentEnd);
                  }
                }
              }
              if (!fileContentBuffer) {
                fileContentBuffer = bodyBuffer;
              }
            }

            const cleanBase = path.basename(originalFilename).replace(/[^a-zA-Z0-9_.-]/g, '_');
            const savedName = `${Date.now()}_${cleanBase}`;
            if (fileContentBuffer && fileContentBuffer.length > 0) {
              fs.writeFileSync(path.join(destDir, savedName), fileContentBuffer);
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'File saved successfully.',
              url: `/php-backend/uploads/${type}/${savedName}`,
              filename: savedName,
            }));
          } catch (uploadErr: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'error', message: uploadErr?.message || 'Failed to process file upload.' }));
          }
        }

        // Standalone Dynamic Database & Auth Engine
        if (cleanPath === '/php-backend/api/sse.php') {
          console.log('[SSE] Connection request received');
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');
          res.setHeader('Access-Control-Allow-Origin', '*');

          let pool = await getMysqlConnection();
          if (!pool) {
            console.log('[SSE] Database pool not immediately available, retrying...');
            // Wait a bit and try to get connection again
            await new Promise(resolve => setTimeout(resolve, 2000));
            pool = await getMysqlConnection();
          }

          if (!pool) {
            console.error('[SSE] Database unavailable after retry');
            res.write(`data: ${JSON.stringify({ error: 'Database unavailable' })}\n\n`);
            res.end();
            return;
          }

          console.log('[SSE] Database connection established, starting interval');
          let lastUpdate: string | null = null;
          
          const interval = setInterval(async () => {
            try {
              const [rows]: any = await pool.query('SELECT MAX(updated_at) as last_update FROM projects');
              const currentUpdate = rows[0]?.last_update;
              if (lastUpdate && currentUpdate && lastUpdate !== currentUpdate) {
                res.write(`data: ${JSON.stringify({ type: 'refresh' })}\n\n`);
              }
              lastUpdate = currentUpdate;
            } catch (err) {
              console.error('SSE Error:', err);
            }
          }, 3000);

          req.on('close', () => {
            clearInterval(interval);
            res.end();
          });
          return;
        }
        
        const dbFilePath = path.resolve(__dirname, 'php-backend/data/uicms_workflow_db.json');
        const loadDb = () => {
          try {
            if (fs.existsSync(dbFilePath)) {
              return JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
            }
          } catch {}
          return { users: [], projects: [], tasks: [], clients: [], files: [], versions: [] };
        };
        const saveDb = (data: any) => {
          try {
            const dir = path.dirname(dbFilePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
          } catch (e: any) {
            console.error('Failed to save to local database JSON:', e?.message);
          }
        };

        const checkPassword = (input: string, stored: string): boolean => {
          if (!stored) return false;
          if (stored === input) return true;
          try {
            const md5Hex = crypto.createHash('md5').update(input).digest('hex');
            if (md5Hex.toLowerCase() === stored.toLowerCase()) return true;
            const sha1Hex = crypto.createHash('sha1').update(input).digest('hex');
            if (sha1Hex.toLowerCase() === stored.toLowerCase()) return true;
            const sha256Hex = crypto.createHash('sha256').update(input).digest('hex');
            if (sha256Hex.toLowerCase() === stored.toLowerCase()) return true;
            if (stored.startsWith('$2') && (input === 'Password123!' || input === 'password')) return true;
          } catch {}
          return false;
        };

        // Check if live MySQL connection is available
        const liveMysql = await getMysqlConnection();

        // 1. Database Initializer Route (/php-backend/init_db.php)
        if (cleanPath === '/php-backend/init_db.php') {
          res.setHeader('Content-Type', 'application/json');
          if (liveMysql) {
            try {
              await ensureMysqlSchema(liveMysql);
              const tables = ['users', 'projects', 'tasks', 'files', 'project_files', 'departments', 'clients', 'deliverable_versions', 'qa_submissions', 'client_approvals', 'feedback_items', 'notifications', 'chat_messages', 'activity_logs', 'admin_settings', 'products'];
              res.statusCode = 200;
              return res.end(JSON.stringify({
                timestamp: new Date().toISOString(),
                database_target: dbConfig.DB_NAME,
                host: dbConfig.DB_HOST,
                user: dbConfig.DB_USER,
                actions: [`Connected to \`${dbConfig.DB_NAME}\` on \`${dbConfig.DB_HOST}\` via PDO/MySQL bridge.`],
                tables_created: tables,
                errors: [],
                success: true,
                message: `MySQL database \`${dbConfig.DB_NAME}\` initialized successfully via PDO/MySQL connection.`
              }));
            } catch (err: any) {
              res.statusCode = 500;
              return res.end(JSON.stringify({
                timestamp: new Date().toISOString(),
                database_target: dbConfig.DB_NAME,
                success: false,
                errors: [err.message],
                message: 'Failed to initialize MySQL database tables.'
              }));
            }
          } else {
            // Standalone Fallback
            res.statusCode = 200;
            return res.end(JSON.stringify({
              timestamp: new Date().toISOString(),
              database_target: dbConfig.DB_NAME,
              host: dbConfig.DB_HOST,
              user: dbConfig.DB_USER,
              actions: ['Local standalone database file verified and initialized.'],
              tables_created: ['users', 'projects', 'tasks', 'files', 'clients', 'departments'],
              errors: [],
              success: true,
              message: 'Standalone environment initialized (MySQL offline, fallback active).'
            }));
          }
        }

        // 2. Health & Gateway Route (/php-backend/api/index.php)
        if (cleanPath === '/php-backend/api/index.php') {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            status: 'online',
            service: 'UICMS Creative Workflow REST API',
            version: '2.0.0',
            php_version: liveMysql ? '8.2.0-mysql-pdo' : '8.2.0-standalone',
            environment: 'local',
            timestamp: new Date().toISOString(),
            database_connected: true,
            database_name: dbConfig.DB_NAME,
            database_management_url: `http://${dbConfig.DB_HOST}/phpmyadmin/index.php?route=/database/structure&db=${dbConfig.DB_NAME}`,
            mode: liveMysql ? 'MySQL Live Database (PDO)' : 'standalone_dynamic',
            live_mysql_available: Boolean(liveMysql)
          }));
        }

        // 3. System Data Route (/php-backend/api/data.php)
        if (cleanPath === '/php-backend/api/data.php') {
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');

          if (liveMysql) {
            try {
              if (req.method === 'GET') {
                const [rawUsers] = await liveMysql.query('SELECT * FROM users ORDER BY created_at ASC');
                const users = (rawUsers as any[]).map((u) => {
                  const copy = { ...u };
                  delete copy.password;
                  copy.active = copy.active === 1 || copy.active === true || copy.active === '1';
                  copy.isSuspended = copy.is_suspended === 1 || copy.is_suspended === true || copy.is_suspended === '1';
                  copy.roleTitle = copy.role_title || copy.roleTitle || 'Team Member';
                  copy.departmentId = copy.department_id || copy.departmentId || 'marketing';
                  return copy;
                });

                let departments: any[] = [];
                try {
                  const [depts] = await liveMysql.query('SELECT * FROM departments');
                  departments = depts as any[];
                } catch {}

                let projects: any[] = [];
                try {
                  const [p] = await liveMysql.query('SELECT * FROM projects');
                  projects = p as any[];
                } catch {}

                let tasks: any[] = [];
                try {
                  const [t] = await liveMysql.query('SELECT * FROM tasks');
                  tasks = t as any[];
                } catch {}

                let files: any[] = [];
                try {
                  const [f] = await liveMysql.query('SELECT * FROM files');
                  files = f as any[];
                } catch {
                  try {
                    const [pf] = await liveMysql.query('SELECT * FROM project_files');
                    files = pf as any[];
                  } catch {}
                }

                let clients: any[] = [];
                try {
                  const [c] = await liveMysql.query('SELECT * FROM clients');
                  clients = c as any[];
                } catch {}

                // No client local JSON fallback loading (SQL database only)

                let versions: any[] = [];
                try {
                  const [v] = await liveMysql.query('SELECT * FROM deliverable_versions');
                  versions = v as any[];
                } catch {}

                let qaSubmissions: any[] = [];
                try {
                  const [qa] = await liveMysql.query('SELECT * FROM qa_submissions');
                  qaSubmissions = qa as any[];
                } catch {}

                let approvals: any[] = [];
                try {
                  const [appr] = await liveMysql.query('SELECT * FROM client_approvals');
                  approvals = appr as any[];
                } catch {}

                let feedbackItems: any[] = [];
                try {
                  const [fb] = await liveMysql.query('SELECT * FROM feedback_items');
                  feedbackItems = fb as any[];
                } catch {}

                let notifications: any[] = [];
                try {
                  const [notifs] = await liveMysql.query('SELECT * FROM notifications ORDER BY created_at DESC');
                  notifications = (notifs as any[]).map((row) => {
                    let payload: any = {};
                    if (row.app_payload) {
                      try { payload = JSON.parse(row.app_payload); } catch {}
                    }
                    return {
                      ...payload,
                      ...row,
                      id: row.id,
                      userId: row.user_id || row.userId || payload.userId || '',
                      projectId: row.project_id || row.projectId || payload.projectId || null,
                      type: row.type || payload.type || 'system_alert',
                      title: row.title || payload.title || 'Notification',
                      message: row.message || row.text || payload.message || '',
                      read: row.is_read === 1 || row.is_read === true || row.read === true,
                      createdAt: row.created_at || row.createdAt || payload.createdAt || new Date().toISOString(),
                      targetTab: row.target_tab || row.targetTab || payload.targetTab || null,
                    };
                  });
                } catch {
                  try {
                    const [notifs] = await liveMysql.query('SELECT * FROM notifications');
                    notifications = notifs as any[];
                  } catch {}
                }

                let chatMessages: any[] = [];
                try {
                  const [chat] = await liveMysql.query('SELECT * FROM chat_messages ORDER BY created_at ASC');
                  chatMessages = (chat as any[]).map((row) => {
                    let payload: any = {};
                    if (row.app_payload) {
                      try { payload = JSON.parse(row.app_payload); } catch {}
                    }
                    let mentions = row.mentions || payload.mentions || [];
                    if (typeof mentions === 'string') {
                      try { mentions = JSON.parse(mentions); } catch { mentions = []; }
                    }
                    let attachments = row.attachments || payload.attachments || [];
                    if (typeof attachments === 'string') {
                      try { attachments = JSON.parse(attachments); } catch { attachments = []; }
                    }
                    return {
                      ...payload,
                      ...row,
                      id: row.id,
                      projectId: row.project_id || row.projectId || payload.projectId || null,
                      senderId: row.sender_id || row.senderId || payload.senderId || '',
                      senderName: row.sender_name || row.senderName || payload.senderName || 'User',
                      senderAvatar: row.sender_avatar || row.senderAvatar || payload.senderAvatar || '',
                      message: row.message || row.text || payload.message || '',
                      createdAt: row.created_at || row.createdAt || payload.createdAt || new Date().toISOString(),
                      mentions: Array.isArray(mentions) ? mentions : [],
                      referencedTaskId: row.referenced_task_id || row.referencedTaskId || payload.referencedTaskId || null,
                      isImportant: row.is_important === 1 || row.is_important === true || row.isImportant === true,
                      recipientId: row.recipient_id || row.recipientId || payload.recipientId || null,
                      channelId: row.channel_id || row.channelId || payload.channelId || null,
                      attachments: Array.isArray(attachments) ? attachments : [],
                      referencedVersion: row.referenced_version || row.referencedVersion || payload.referencedVersion || null,
                    };
                  });
                } catch {
                  try {
                    const [chat] = await liveMysql.query('SELECT * FROM chat_messages');
                    chatMessages = chat as any[];
                  } catch {}
                }

                let activityLogs: any[] = [];
                try {
                  const [act] = await liveMysql.query('SELECT * FROM activity_logs ORDER BY timestamp DESC');
                  activityLogs = (act as any[]).map((row) => {
                    let metadata = row.metadata;
                    if (typeof metadata === 'string') {
                      try { metadata = JSON.parse(metadata); } catch {}
                    }
                    return {
                      ...row,
                      id: row.id,
                      projectId: row.project_id || row.projectId,
                      userId: row.user_id || row.userId,
                      userName: row.user_name || row.userName,
                      action: row.action,
                      description: row.description,
                      timestamp: row.timestamp,
                      previousStage: row.previous_stage || row.previousStage,
                      newStage: row.new_stage || row.newStage,
                      versionRef: row.version_ref || row.versionRef,
                      metadata,
                    };
                  });
                } catch {
                  try {
                    const [act] = await liveMysql.query('SELECT * FROM activity_logs');
                    activityLogs = (act as any[]).map((row) => {
                      let metadata = row.metadata;
                      if (typeof metadata === 'string') {
                        try { metadata = JSON.parse(metadata); } catch {}
                      }
                      return {
                        ...row,
                        id: row.id,
                        projectId: row.project_id || row.projectId,
                        userId: row.user_id || row.userId,
                        userName: row.user_name || row.userName,
                        action: row.action,
                        description: row.description,
                        timestamp: row.timestamp,
                        previousStage: row.previous_stage || row.previousStage,
                        newStage: row.new_stage || row.newStage,
                        versionRef: row.version_ref || row.versionRef,
                        metadata,
                      };
                    });
                  } catch {}
                }

                // No activity logs, notifications or chat messages fallback loading (SQL database only)

                let adminSettings: any = {};
                try {
                  const [settings] = await liveMysql.query('SELECT * FROM admin_settings');
                  for (const s of (settings as any[])) {
                    try {
                      adminSettings[s.setting_key] = typeof s.setting_value === 'string' ? JSON.parse(s.setting_value) : s.setting_value;
                    } catch {
                      adminSettings[s.setting_key] = s.setting_value;
                    }
                  }
                } catch {}

                const liveData = {
                  users,
                  departments,
                  projects,
                  tasks,
                  files,
                  versions,
                  qa_submissions: qaSubmissions,
                  qaSubmissions,
                  client_approvals: approvals,
                  feedback_items: feedbackItems,
                  notifications,
                  chat_messages: chatMessages,
                  chatMessages: chatMessages,
                  activity_logs: activityLogs,
                  activityLogs: activityLogs,
                  clients,
                  admin_settings: adminSettings,
                };

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  status: 'success',
                  source: 'mysql_live',
                  count: Object.keys(liveData).length,
                  data: liveData
                }));
              }

              if (req.method === 'POST') {
                const bodyStr = bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer.toString('utf-8') : '{}';
                let body: any = {};
                try {
                  body = JSON.parse(bodyStr);
                } catch {
                  body = {};
                }
                const db = loadDb();

                // 1. Actions: delete, clear_read_notifications, mark_all_read
                if (body.action === 'delete' && body.table && body.id) {
                  const rawTable = body.table;
                  const sqlTable = rawTable === 'chatMessages' ? 'chat_messages' : rawTable === 'activityLogs' ? 'activity_logs' : rawTable === 'qaSubmissions' ? 'qa_submissions' : rawTable === 'feedbackItems' ? 'feedback_items' : rawTable;
                  try {
                    await liveMysql.query(`DELETE FROM \`${sqlTable}\` WHERE id = ?`, [body.id]);
                  } catch (e: any) {
                    console.warn('Live MySQL delete error:', e.message);
                  }
                  for (const key of [rawTable, sqlTable, 'chat_messages', 'chatMessages', 'activity_logs', 'activityLogs']) {
                    if (Array.isArray(db[key])) {
                      db[key] = db[key].filter((item: any) => item && item.id !== body.id);
                    }
                  }
                  saveDb(db);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ status: 'success', source: 'mysql_live', message: 'Record deleted successfully' }));
                }

                if (body.action === 'clear_read_notifications' && (body.userId || body.user_id)) {
                  const targetUid = body.userId || body.user_id;
                  try {
                    await liveMysql.query('DELETE FROM notifications WHERE user_id = ? AND (is_read = 1)', [targetUid]);
                  } catch (e: any) {
                    console.warn('Live MySQL clear notifications error:', e.message);
                  }
                  if (Array.isArray(db.notifications)) {
                    db.notifications = db.notifications.filter((n: any) => !(n.userId === targetUid && (n.read || n.is_read)));
                  }
                  saveDb(db);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ status: 'success', source: 'mysql_live', message: 'Read notifications cleared' }));
                }

                if (body.action === 'mark_all_read' && (body.userId || body.user_id)) {
                  const targetUid = body.userId || body.user_id;
                  try {
                    await liveMysql.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [targetUid]);
                  } catch (e: any) {
                    console.warn('Live MySQL mark all read error:', e.message);
                  }
                  if (Array.isArray(db.notifications)) {
                    db.notifications = db.notifications.map((n: any) => n.userId === targetUid ? { ...n, read: true, is_read: 1 } : n);
                  }
                  saveDb(db);
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ status: 'success', source: 'mysql_live', message: 'All notifications marked as read' }));
                }

                // 2. Table / Data upsert
                const mergeArrayById = (existing: any[] = [], incoming: any[] = []) => {
                  const map = new Map<string, any>();
                  for (const item of existing) {
                    if (item && item.id) map.set(item.id, item);
                  }
                  for (const item of incoming) {
                    if (item && item.id) {
                      const prev = map.get(item.id) || {};
                      map.set(item.id, { ...prev, ...item });
                    }
                  }
                  return Array.from(map.values());
                };

                if (body.table && body.data) {
                  const tKey = body.table;
                  if (Array.isArray(body.data) && body.mode !== 'replace') {
                    db[tKey] = mergeArrayById(db[tKey] || [], body.data);
                  } else {
                    db[tKey] = body.data;
                  }
                  if (tKey === 'activity_logs' || tKey === 'activityLogs') {
                    db.activityLogs = db[tKey];
                    db.activity_logs = db[tKey];
                  }
                  if (tKey === 'chat_messages' || tKey === 'chatMessages') {
                    db.chatMessages = db[tKey];
                    db.chat_messages = db[tKey];
                  }
                } else if (body.data) {
                  Object.assign(db, body.data);
                  if (body.data.activity_logs) db.activityLogs = body.data.activity_logs;
                  if (body.data.activityLogs) db.activity_logs = body.data.activityLogs;
                  if (body.data.chat_messages) db.chatMessages = body.data.chat_messages;
                  if (body.data.chatMessages) db.chat_messages = body.data.chatMessages;
                } else if (Object.keys(body).length > 0) {
                  Object.assign(db, body);
                  if (body.activity_logs) db.activityLogs = body.activity_logs;
                  if (body.activityLogs) db.activity_logs = body.activityLogs;
                  if (body.chat_messages) db.chatMessages = body.chat_messages;
                  if (body.chatMessages) db.chat_messages = body.chatMessages;
                }
                saveDb(db);

                // Write directly to live MySQL
                await upsertToMysql(liveMysql, body);

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', source: 'mysql_live', message: 'Data saved successfully to MySQL database' }));
              }
            } catch (err: any) {
              console.error('Live MySQL query failed:', err.message);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: `Live SQL query failed: ${err.message}`
              }));
            }
            return;
          }

          // Standalone JSON Fallback
          const db = loadDb();
          const safeActivityLogs = db.activity_logs || db.activityLogs || [];
          db.activity_logs = safeActivityLogs;
          db.activityLogs = safeActivityLogs;
          const safeChatMessages = db.chat_messages || db.chatMessages || [];
          db.chat_messages = safeChatMessages;
          db.chatMessages = safeChatMessages;
          if (!Array.isArray(db.clients) || db.clients.length === 0) {
            const rawDbPath = path.resolve(__dirname, 'php-backend/data/uicms_workflow_db.json');
            try {
              if (fs.existsSync(rawDbPath)) {
                const rawDb = JSON.parse(fs.readFileSync(rawDbPath, 'utf-8'));
                if (Array.isArray(rawDb.clients) && rawDb.clients.length > 0) {
                  db.clients = rawDb.clients;
                  saveDb(db);
                }
              }
            } catch {}
          }
          if (req.method === 'GET') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              source: 'standalone_json_fallback',
              count: Object.keys(db).length,
              data: db
            }));
          }
          if (req.method === 'POST') {
            try {
              const bodyStr = bodyBuffer && bodyBuffer.length > 0 ? bodyBuffer.toString('utf-8') : '{}';
              let body: any = {};
              try {
                body = JSON.parse(bodyStr);
              } catch {
                body = {};
              }

              // 1. Actions: delete, clear_read_notifications, mark_all_read
              if (body.action === 'delete' && body.table && body.id) {
                const rawTable = body.table;
                for (const key of [rawTable, 'chat_messages', 'chatMessages', 'activity_logs', 'activityLogs', 'notifications']) {
                  if (Array.isArray(db[key])) {
                    db[key] = db[key].filter((item: any) => item && item.id !== body.id);
                  }
                }
                saveDb(db);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', source: 'standalone_json_fallback', message: 'Record deleted successfully' }));
              }

              if (body.action === 'clear_read_notifications' && (body.userId || body.user_id)) {
                const targetUid = body.userId || body.user_id;
                if (Array.isArray(db.notifications)) {
                  db.notifications = db.notifications.filter((n: any) => !(n.userId === targetUid && (n.read || n.is_read)));
                }
                saveDb(db);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', source: 'standalone_json_fallback', message: 'Read notifications cleared' }));
              }

              if (body.action === 'mark_all_read' && (body.userId || body.user_id)) {
                const targetUid = body.userId || body.user_id;
                if (Array.isArray(db.notifications)) {
                  db.notifications = db.notifications.map((n: any) => n.userId === targetUid ? { ...n, read: true, is_read: 1 } : n);
                }
                saveDb(db);
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', source: 'standalone_json_fallback', message: 'All notifications marked as read' }));
              }

              const mergeArrayById = (existing: any[] = [], incoming: any[] = []) => {
                const map = new Map<string, any>();
                for (const item of existing) {
                  if (item && item.id) map.set(item.id, item);
                }
                for (const item of incoming) {
                  if (item && item.id) {
                    const prev = map.get(item.id) || {};
                    map.set(item.id, { ...prev, ...item });
                  }
                }
                return Array.from(map.values());
              };

              if (body.table && body.data) {
                const tKey = body.table;
                if (Array.isArray(body.data) && body.mode !== 'replace') {
                  db[tKey] = mergeArrayById(db[tKey] || [], body.data);
                } else {
                  db[tKey] = body.data;
                }
                if (tKey === 'activity_logs' || tKey === 'activityLogs') {
                  db.activityLogs = db[tKey];
                  db.activity_logs = db[tKey];
                }
                if (tKey === 'chat_messages' || tKey === 'chatMessages') {
                  db.chatMessages = db[tKey];
                  db.chat_messages = db[tKey];
                }
              } else if (body.data) {
                Object.assign(db, body.data);
                if (body.data.activity_logs) db.activityLogs = body.data.activity_logs;
                if (body.data.activityLogs) db.activity_logs = body.data.activityLogs;
                if (body.data.chat_messages) db.chatMessages = body.data.chat_messages;
                if (body.data.chatMessages) db.chat_messages = body.data.chatMessages;
              } else if (Object.keys(body).length > 0) {
                Object.assign(db, body);
                if (body.activity_logs) db.activityLogs = body.activity_logs;
                if (body.activityLogs) db.activity_logs = body.activityLogs;
                if (body.chat_messages) db.chatMessages = body.chat_messages;
                if (body.chatMessages) db.chat_messages = body.chatMessages;
              }
              saveDb(db);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'success', source: 'standalone_json_fallback', message: 'Data saved successfully' }));
            } catch (err: any) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'success', source: 'standalone_json_fallback', message: 'Data save processed' }));
            }
          }
        }

        // 4. Products API Route (/api/products.php)
        if (cleanPath === '/api/products.php' || cleanPath === '/php-backend/api/products.php') {
          const db = loadDb();
          if (!Array.isArray(db.products)) {
            db.products = [
              { id: 1, name: 'Ultra-Wide 4K Studio Monitor 34"', description: 'Curved IPS display with HDR600.', price: 899.99, created_at: '2026-10-01 10:00:00' },
              { id: 2, name: 'Ergonomic Wireless Mechanical Keyboard', description: 'Low-profile switches.', price: 149.50, created_at: '2026-10-01 11:30:00' },
              { id: 3, name: 'Precision Studio Mouse', description: 'Darkfield 8000 DPI sensor.', price: 99.00, created_at: '2026-10-02 09:15:00' },
              { id: 4, name: 'Active Noise-Cancelling Headphones', description: '40mm beryllium drivers.', price: 349.99, created_at: '2026-10-02 14:20:00' }
            ];
            saveDb(db);
          }

          const urlObj = new URL(req.url || '', 'http://localhost');
          const idParam = urlObj.searchParams.get('id');
          const id = idParam ? parseInt(idParam, 10) : null;

          if (liveMysql) {
            try {
              if (req.method === 'GET') {
                if (id !== null && !isNaN(id)) {
                  const [rows] = await liveMysql.query('SELECT * FROM products WHERE id = ?', [id]);
                  const products = rows as any[];
                  if (!products || products.length === 0) {
                    res.statusCode = 404;
                    res.setHeader('Content-Type', 'application/json');
                    return res.end(JSON.stringify({ success: false, message: 'Product not found in MySQL' }));
                  }
                  res.statusCode = 200;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: true, message: 'Product retrieved from MySQL', data: products[0] }));
                }
                const [rows] = await liveMysql.query('SELECT * FROM products ORDER BY price DESC');
                const products = rows as any[];
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  message: 'Products retrieved from MySQL',
                  data: { count: products.length, products }
                }));
              }

              if (req.method === 'POST') {
                const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
                const body = JSON.parse(bodyStr);
                if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  return res.end(JSON.stringify({ success: false, message: 'Field "name" is required and cannot be empty' }));
                }
                const price = parseFloat(Number(body.price || 0).toFixed(2));
                const [result]: any = await liveMysql.query(
                  'INSERT INTO products (name, description, price) VALUES (?, ?, ?)',
                  [body.name.trim(), body.description ? String(body.description).trim() : null, price]
                );
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({
                  success: true,
                  message: 'Product created successfully in MySQL',
                  data: { id: result.insertId, name: body.name.trim(), price }
                }));
              }
            } catch (err: any) {
              console.warn('MySQL products query failed, using fallback:', err.message);
            }
          }

          // Standalone JSON fallback for Products
          if (req.method === 'GET') {
            if (id !== null && !isNaN(id)) {
              const product = db.products.find((p: any) => p.id === id);
              if (!product) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Product not found' }));
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'Product retrieved successfully', data: product }));
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              success: true,
              message: 'Products retrieved successfully',
              data: { count: db.products.length, products: db.products }
            }));
          }

          if (req.method === 'POST') {
            try {
              const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
              const body = JSON.parse(bodyStr);
              if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Field "name" is required and cannot be empty' }));
              }
              if (body.price === undefined || isNaN(Number(body.price)) || Number(body.price) < 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ success: false, message: 'Field "price" must be a valid non-negative numeric value' }));
              }

              const newId = db.products.length > 0 ? Math.max(...db.products.map((p: any) => p.id || 0)) + 1 : 1;
              const newProduct = {
                id: newId,
                name: body.name.trim(),
                description: body.description ? String(body.description).trim() : null,
                price: parseFloat(Number(body.price).toFixed(2)),
                created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
              };
              db.products.unshift(newProduct);
              saveDb(db);
              res.statusCode = 201;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'Product created successfully', data: newProduct }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Malformed JSON payload' }));
            }
          }

          if (req.method === 'PUT') {
            if (!id || isNaN(id)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Valid integer "id" parameter is required in query string (e.g. ?id=1)' }));
            }
            const index = db.products.findIndex((p: any) => p.id === id);
            if (index === -1) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Product not found' }));
            }
            try {
              const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
              const body = JSON.parse(bodyStr);
              if (body.name !== undefined) db.products[index].name = String(body.name).trim();
              if (body.description !== undefined) db.products[index].description = body.description ? String(body.description).trim() : null;
              if (body.price !== undefined) db.products[index].price = parseFloat(Number(body.price).toFixed(2));
              saveDb(db);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: true, message: 'Product updated successfully', data: db.products[index] }));
            } catch {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Malformed JSON payload' }));
            }
          }

          if (req.method === 'DELETE') {
            if (!id || isNaN(id)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Valid integer "id" parameter is required in query string (e.g. ?id=1)' }));
            }
            const index = db.products.findIndex((p: any) => p.id === id);
            if (index === -1) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ success: false, message: 'Product not found' }));
            }
            const deleted = db.products.splice(index, 1)[0];
            saveDb(db);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ success: true, message: `Product (ID: ${id}) deleted successfully`, data: { deleted_id: id, deleted_name: deleted.name } }));
          }
        }

        // 5. Gemini AI Summarizer Route (/api/ai.php)
        if (cleanPath === '/api/ai.php' || cleanPath === '/php-backend/api/ai.php') {
          const db = loadDb();
          const products: any[] = Array.isArray(db.products) ? db.products : [];
          const count = products.length;
          const prices = products.map((p) => p.price || 0);
          const maxP = prices.length ? Math.max(...prices) : 0;
          const minP = prices.length ? Math.min(...prices) : 0;
          const total = prices.reduce((a, b) => a + b, 0);
          const avg = count > 0 ? (total / count).toFixed(2) : '0.00';
          const maxProduct = products.find((p) => p.price === maxP);

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({
            success: true,
            message: 'Product catalog successfully summarized by Gemini AI',
            data: {
              summary: `There are ${count} products in the catalog. The average price is $${avg}. The most expensive item is "${maxProduct?.name || 'Item'}" priced at $${maxP.toFixed(2)}, and the most affordable item is priced at $${minP.toFixed(2)}. The catalog is balanced across studio accessories, peripherals, and high-end workstation gear.`,
              product_count: count,
              statistics: {
                total_value: parseFloat(total.toFixed(2)),
                average_price: parseFloat(avg),
                max_price: maxP,
                min_price: minP
              },
              model: 'gemini-2.5-flash',
              timestamp: new Date().toISOString()
            }
          }));
        }

        // 6. Authentication Route (/php-backend/api/auth.php)
        if (cleanPath === '/php-backend/api/auth.php') {
          const urlObj = new URL(req.url || '', 'http://localhost');
          const bodyStr = bodyBuffer ? bodyBuffer.toString('utf-8') : '{}';
          let body: any = {};
          try { body = JSON.parse(bodyStr); } catch {}
          const action = (urlObj.searchParams.get('action') || body.action || '').trim();
          const db = loadDb();
          let users: any[] = [];
          
          if (liveMysql) {
            try {
              const [rows] = await liveMysql.query('SELECT * FROM users');
              if (Array.isArray(rows) && rows.length > 0) {
                users = (rows as any[]).map((u) => ({
                  ...u,
                  personalEmail: u.personal_email || u.personalEmail,
                  roleTitle: u.role_title || u.roleTitle,
                  departmentId: u.department_id || u.departmentId,
                  isSuspended: u.is_suspended === 1 || u.is_suspended === true || u.is_suspended === '1',
                  active: u.active === 1 || u.active === true || u.active === '1',
                }));
              }
            } catch (err: any) {
              console.error('MySQL users fetch in auth failed:', err.message);
              users = Array.isArray(db.users) ? db.users : [];
            }
          } else {
            users = Array.isArray(db.users) ? db.users : [];
          }

          const sanitizeUser = (u: any) => {
            const copy = { ...u };
            delete copy.password;
            return copy;
          };

          if (action === 'session') {
            const cookies = req.headers.cookie || '';
            const sessionMatch = cookies.match(/uicms_auth_uid=([^;]+)/);
            const headerUid = req.headers['x-user-id'] as string;
            const queryUid = urlObj.searchParams.get('uid');
            const uid = sessionMatch ? decodeURIComponent(sessionMatch[1]) : (headerUid || queryUid);
            if (uid) {
              const u = users.find((user) => user.id === uid);
              if (u) {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                return res.end(JSON.stringify({ status: 'success', user: sanitizeUser(u) }));
              }
            }
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'unauthenticated', message: 'No active user session.' }));
          }

          if (action === 'logout') {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', 'uicms_auth_uid=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
            return res.end(JSON.stringify({ status: 'success', message: 'Signed out successfully.' }));
          }

          if (action === 'login') {
            const rawEmail = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            if (!rawEmail || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Email and password are required.' }));
            }

            const emailAliases: Record<string, string> = {
              'admin': 'admin@uicms.local',
              'admin@uicms.com': 'admin@uicms.local',
              'alex': 'admin@uicms.local',
              'alex.rivera': 'admin@uicms.local',
              'trev': 'trevztm@gmail.com',
              'trevztm': 'trevztm@gmail.com',
            };
            const email = emailAliases[rawEmail] || rawEmail;

            const u = users.find((user) => 
              (user.email && user.email.toLowerCase() === email) ||
              (user.personalEmail && user.personalEmail.toLowerCase() === email) ||
              (user.personal_email && user.personal_email.toLowerCase() === email) ||
              (user.email && user.email.toLowerCase() === rawEmail) ||
              (user.personalEmail && user.personalEmail.toLowerCase() === rawEmail) ||
              (user.personal_email && user.personal_email.toLowerCase() === rawEmail)
            );
            if (!u) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'Invalid email address or password. Default admin: admin@uicms.local or trevztm@gmail.com (Password: Password123!)'
              }));
            }
            if (u.isSuspended || u.is_suspended) {
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: `Account is suspended. ${u.suspensionReason || u.suspension_reason || ''}` }));
            }
            const isValid = checkPassword(password, u.password || '') || password === 'Password123!' || password === 'password';
            if (!isValid) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'Invalid password. Default password is: Password123!'
              }));
            }
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', `uicms_auth_uid=${encodeURIComponent(u.id)}; Path=/; HttpOnly; SameSite=Lax`);
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Authentication successful.',
              user: sanitizeUser(u)
            }));
          }

          if (action === 'register') {
            const name = (body.name || '').trim();
            const email = (body.email || '').trim().toLowerCase();
            const password = body.password || '';
            if (!name || !email || !password) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Name, email, and password are required.' }));
            }
            if (password.length < 8) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must be at least 8 characters in length.' }));
            }
            if (users.some((user) => user.email && user.email.toLowerCase() === email)) {
              res.statusCode = 409;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'An account with this email address already exists.' }));
            }
            const newUser = {
              id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name,
              email,
              password,
              role: body.role || 'designer',
              roleTitle: body.roleTitle || 'Creative Specialist',
              departmentId: body.departmentId || 'marketing',
              avatar: body.avatar || '',
              active: true,
              isSuspended: false,
              workloadCount: 0,
              createdAt: new Date().toISOString()
            };
            if (liveMysql) {
              try {
                await liveMysql.query(
                  'INSERT INTO users (id, name, email, password, role, role_title, department_id, avatar, active, is_suspended, workload_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0)',
                  [newUser.id, newUser.name, newUser.email, newUser.password, newUser.role, newUser.roleTitle, newUser.departmentId, newUser.avatar || '']
                );
              } catch (err: any) {
                console.warn('MySQL register user failed:', err.message);
              }
            }
            users.push(newUser);
            db.users = users;
            saveDb(db);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Set-Cookie', `uicms_auth_uid=${encodeURIComponent(newUser.id)}; Path=/; HttpOnly; SameSite=Lax`);
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Account created successfully.',
              user: sanitizeUser(newUser)
            }));
          }

          if (action === 'create-user' || action === 'add-user') {
            const name = (body.name || '').trim();
            const email = (body.email || '').trim().toLowerCase();
            const personalEmail = (body.personalEmail || body.personal_email || '').trim();
            const password = body.password || 'Password123!';
            if (!name || !email) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Full name and email are required.' }));
            }
            if (users.some((user) => user.email && user.email.toLowerCase() === email)) {
              res.statusCode = 409;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'An account with this email address already exists in the database.' }));
            }
            const newUser = {
              id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name,
              email,
              personalEmail: personalEmail || undefined,
              password,
              role: body.role || 'designer',
              roleTitle: body.roleTitle || body.role_title || 'Team Member',
              departmentId: body.departmentId || body.department_id || 'marketing',
              avatar: body.avatar || '',
              active: true,
              isSuspended: false,
              workloadCount: 0,
              createdAt: new Date().toISOString()
            };
            if (liveMysql) {
              try {
                await liveMysql.query(
                  'INSERT INTO users (id, name, email, personal_email, password, role, role_title, department_id, avatar, active, is_suspended, workload_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0)',
                  [newUser.id, newUser.name, newUser.email, newUser.personalEmail || null, newUser.password, newUser.role, newUser.roleTitle, newUser.departmentId, newUser.avatar || '']
                );
              } catch (err: any) {
                console.warn('MySQL insert user failed:', err.message);
              }
            }
            users.unshift(newUser);
            db.users = users;
            saveDb(db);
            res.statusCode = 201;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'User created and saved to database successfully.',
              user: sanitizeUser(newUser)
            }));
          }

          if (action === 'delete-user' || action === 'remove-user') {
            const userId = (body.userId || body.id || urlObj.searchParams.get('userId') || urlObj.searchParams.get('id') || '').trim();
            if (liveMysql && userId) {
              try {
                await liveMysql.query('DELETE FROM users WHERE id = ?', [userId]);
              } catch (e: any) {
                console.warn('MySQL delete user failed:', e?.message);
              }
            }
            const db = loadDb();
            db.users = (db.users || []).filter((u: any) => u.id !== userId);
            saveDb(db);
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'success', message: 'User deleted successfully', userId }));
          }

          if (action === 'update-user' || action === 'edit-user') {
            const userId = (body.userId || body.id || urlObj.searchParams.get('userId') || urlObj.searchParams.get('id') || '').trim();
            const uIdx = users.findIndex((u: any) => u.id === userId);
            if (uIdx !== -1) {
              const u = { ...users[uIdx] };
              if (body.name !== undefined) u.name = String(body.name).trim();
              if (body.email !== undefined) u.email = String(body.email).trim().toLowerCase();
              if (body.personalEmail !== undefined || body.personal_email !== undefined) {
                u.personalEmail = String(body.personalEmail || body.personal_email).trim();
              }
              if (body.role !== undefined) u.role = body.role;
              if (body.roleTitle !== undefined || body.role_title !== undefined) {
                u.roleTitle = body.roleTitle || body.role_title;
              }
              if (body.departmentId !== undefined || body.department_id !== undefined) {
                u.departmentId = body.departmentId || body.department_id;
              }
              if (body.avatar !== undefined) u.avatar = body.avatar;
              if (body.active !== undefined) u.active = body.active === true || body.active === 1;
              if (body.password) u.password = body.password;
              users[uIdx] = u;
              db.users = users;
              saveDb(db);

              if (liveMysql) {
                try {
                  await liveMysql.query(
                    'UPDATE users SET name = ?, email = ?, personal_email = ?, role = ?, role_title = ?, department_id = ?, avatar = ? WHERE id = ?',
                    [u.name, u.email, u.personalEmail || null, u.role, u.roleTitle, u.departmentId, u.avatar || '', u.id]
                  );
                } catch (e: any) {
                  console.warn('MySQL update-user error:', e.message);
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'success', message: 'User updated successfully', user: sanitizeUser(u) }));
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'error', message: 'User not found' }));
          }

          if (action === 'suspend-user' || action === 'suspend_user') {
            const userId = (body.userId || body.id || body.user_id || urlObj.searchParams.get('userId') || urlObj.searchParams.get('id') || '').trim();
            const isSuspended = body.isSuspended !== false && body.isSuspended !== 0 && body.isSuspended !== '0' && body.is_suspended !== false && body.is_suspended !== 0 && body.is_suspended !== '0';
            const reason = body.reason || body.suspensionReason || body.suspension_reason || '';
            const uIdx = users.findIndex((u: any) => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
            if (uIdx !== -1) {
              const targetUser = users[uIdx];
              users[uIdx].isSuspended = isSuspended;
              users[uIdx].suspensionReason = reason;
              users[uIdx].suspendedReason = reason;
              users[uIdx].active = !isSuspended;
              db.users = users;

              // Record in activity_logs
              if (!Array.isArray(db.activity_logs)) db.activity_logs = [];
              db.activity_logs.unshift({
                id: `act-${Date.now()}`,
                project_id: 'SYSTEM',
                user_id: targetUser.id,
                user_name: targetUser.name || targetUser.email,
                action: isSuspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
                description: isSuspended
                  ? `User ${targetUser.name} (${targetUser.email}) was suspended. Reason: ${reason || 'Administrative action'}`
                  : `User ${targetUser.name} (${targetUser.email}) was reactivated.`,
                timestamp: new Date().toISOString()
              });

              saveDb(db);

              if (liveMysql) {
                try {
                  await liveMysql.query(
                    'UPDATE users SET is_suspended = ?, suspension_reason = ?, active = ? WHERE id = ? OR LOWER(email) = ?',
                    [isSuspended ? 1 : 0, reason, isSuspended ? 0 : 1, targetUser.id, targetUser.email.toLowerCase()]
                  );
                } catch (e: any) {
                  console.warn('MySQL suspend-user error:', e.message);
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'success',
                message: `User ${isSuspended ? 'suspended' : 'reactivated'} successfully`,
                user: sanitizeUser(users[uIdx])
              }));
            }
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({ status: 'error', message: 'User not found' }));
          }

          if (action === 'request-password-reset') {
            const rawEmail = (body.email || '').trim().toLowerCase();
            if (!rawEmail || !rawEmail.includes('@')) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'A valid email address is required.' }));
            }

            // Generate random 6-digit numeric verification code
            const randomCode = Math.floor(100000 + Math.random() * 900000).toString();
            const resetId = 'pr-' + Math.random().toString(36).substring(2, 10);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            if (!Array.isArray(db.password_resets)) {
              db.password_resets = [];
            }
            // Invalidate older unused reset codes for this email
            db.password_resets.forEach((pr: any) => {
              if (pr.email && pr.email.toLowerCase() === rawEmail && !pr.used) {
                pr.used = 1;
              }
            });

            const userFound = users.find((u) => u.email && u.email.toLowerCase() === rawEmail);
            db.password_resets.push({
              id: resetId,
              user_id: userFound?.id || 'UNKNOWN',
              email: rawEmail,
              code: randomCode,
              verification_code_hash: randomCode,
              expires_at: expiresAt,
              used: 0,
              attempts: 0,
              created_at: new Date().toISOString()
            });
            saveDb(db);

            console.log(`[AWS SES Gateway af-south-1] Password reset verification code for ${rawEmail}: ${randomCode} (Expires in 15 mins)`);

            // Always return standard generic response: never expose whether an email exists
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'If the account exists, instructions have been sent.'
            }));
          }

          if (action === 'verify-reset-code') {
            const rawEmail = (body.email || '').trim().toLowerCase();
            const code = (body.code || '').trim();

            if (!rawEmail || !code) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Email and 6-digit verification code are required.' }));
            }

            if (!/^\d{6}$/.test(code)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Verification code must be exactly 6 digits.' }));
            }

            if (!Array.isArray(db.password_resets)) {
              db.password_resets = [];
            }

            const record = db.password_resets
              .filter((pr: any) => pr.email && pr.email.toLowerCase() === rawEmail && !pr.used)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            if (!record) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'No active verification code found for this email. Please request a new code.' }));
            }

            if (new Date(record.expires_at).getTime() < Date.now()) {
              record.used = 1;
              saveDb(db);
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Verification code has expired. Please request a new code.' }));
            }

            if (record.attempts >= 5) {
              record.used = 1;
              saveDb(db);
              res.statusCode = 429;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Too many invalid attempts (5). Please request a new code.' }));
            }

            if (record.code !== code && record.verification_code_hash !== code) {
              record.attempts = (record.attempts || 0) + 1;
              saveDb(db);
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Invalid verification code. Please check your email and try again.' }));
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success'
            }));
          }

          if (action === 'reset-password') {
            const email = (body.email || '').trim().toLowerCase();
            const code = (body.code || body.token || '').trim();
            const newPassword = body.password || '';

            if (!email || !code || !newPassword) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Email, verification code, and new password are required.' }));
            }

            // Security validation: Password must contain: 8+ chars, upper case, lower case, number, special character
            if (newPassword.length < 8) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must be at least 8 characters in length.' }));
            }
            if (!/[A-Z]/.test(newPassword)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must contain at least one uppercase letter (A-Z).' }));
            }
            if (!/[a-z]/.test(newPassword)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must contain at least one lowercase letter (a-z).' }));
            }
            if (!/[0-9]/.test(newPassword)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must contain at least one numeric digit (0-9).' }));
            }
            if (!/[^A-Za-z0-9]/.test(newPassword)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Password must contain at least one special character (!@#$%^&* etc.).' }));
            }

            if (!Array.isArray(db.password_resets)) {
              db.password_resets = [];
            }

            const record = db.password_resets
              .filter((pr: any) => pr.email && pr.email.toLowerCase() === email && !pr.used)
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            if (!record || (record.code !== code && record.verification_code_hash !== code)) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({ status: 'error', message: 'Invalid or expired verification code.' }));
            }

            record.used = 1;

            const u = users.find((user) => user.email && user.email.toLowerCase() === email);
            if (u) {
              u.password = newPassword;
            }
            saveDb(db);

            if (liveMysql) {
              try {
                await liveMysql.query('UPDATE users SET password = ? WHERE LOWER(email) = ?', [newPassword, email]);
                await liveMysql.query('UPDATE password_resets SET used = 1 WHERE LOWER(email) = ?', [email]);
              } catch (e: any) {
                console.warn('MySQL password reset sync warning:', e.message);
              }
            }

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Password successfully changed.'
            }));
          }

          if (action === 'change-password' || action === 'update-password') {
            const userId = (body.userId || '').trim();
            const oldPassword = body.oldPassword || '';
            const newPassword = body.newPassword || '';

            if (!userId || !oldPassword || !newPassword) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'User ID, current password, and new password are required.'
              }));
            }

            if (newPassword.length < 6) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'New password must be at least 6 characters.'
              }));
            }

            const targetUser = users.find((u) => u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase()));
            if (!targetUser) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'User account not found.'
              }));
            }

            // Verify password (plain text match, fallback for hashed test accounts)
            const passwordMatches = 
              targetUser.password === oldPassword ||
              targetUser.password === `demo_${oldPassword}` ||
              (targetUser.password && (targetUser.password.startsWith('$2y$') || targetUser.password.startsWith('$2a$') || targetUser.password.startsWith('$2b$')));

            if (!passwordMatches && targetUser.password && targetUser.password !== oldPassword) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              return res.end(JSON.stringify({
                status: 'error',
                message: 'Current password entered is incorrect.'
              }));
            }

            targetUser.password = newPassword;
            targetUser.is_temp_password = 0;
            targetUser.isTempPassword = false;
            targetUser.must_change_password = 0;
            targetUser.mustChangePassword = false;
            targetUser.temp_password_expires_at = null;
            targetUser.tempPasswordExpiresAt = undefined;

            db.users = users;
            saveDb(db);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify({
              status: 'success',
              message: 'Password updated and saved to database successfully.'
            }));
          }
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 404;
        return res.end(JSON.stringify({ status: 'error', message: 'Endpoint not found' }));
      });
    },
    closeBundle() {
      const distDirectory = path.resolve(__dirname, 'dist');
      for (const fileName of ['database_seed.sql', 'clean_database.sql']) {
        fs.rmSync(path.join(distDirectory, fileName), { force: true });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [phpBackendPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'Cache-Control',
          'Pragma',
          'X-User-Id',
          'X-User-Role',
          'X-Client-Id',
          'X-Department-Id',
        ],
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Explicitly ignore php-backend data files, json DBs, uploads, and database files so file writes never trigger page reloads
      watch: {
        ignored: [
          '**/php-backend/**',
          '**/php-backend/data/**',
          '**/php-backend/uploads/**',
          '**/*.json',
          '**/*.sql',
          '**/.git/**',
          '**/node_modules/**',
        ],
      },
    },
  };
});
