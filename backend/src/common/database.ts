/**
 * @file: database.ts
 * @description: Common database connection module using PostgreSQL.
 * @dependencies: pg
 * @created: 2026-01-27
 */

import { Pool } from 'pg';

// Парсим connection string
function parseConnectionString(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || 'localhost',
      port: parseInt(parsed.port || '5432', 10),
      database: parsed.pathname?.slice(1) || 'imlight',
      user: parsed.username || 'postgres',
      password: parsed.password || undefined,
    };
  } catch {
    // Если не удалось распарсить, используем значения по умолчанию
    return {
      host: 'localhost',
      port: 5432,
      database: 'imlight',
      user: 'postgres',
      password: undefined,
    };
  }
}

const dbUrl = process.env.DATABASE_URL || 'postgres://postgres@localhost:5432/imlight';
const dbConfig = parseConnectionString(dbUrl);

// Используем PGPASSWORD из окружения, если он есть
const password = dbConfig.password || process.env.PGPASSWORD;

// Если нет пароля (undefined или пустая строка) и host = localhost, используем Unix socket (peer authentication)
// Это работает для локальных пользователей системы
const hasPassword = password && password.trim() !== '';
const useUnixSocket = dbConfig.host === 'localhost' && !hasPassword && process.platform !== 'win32';

// Для Unix socket используем текущего пользователя системы (peer authentication)
// Для TCP/IP используем пользователя из DATABASE_URL или текущего пользователя
const dbUser = useUnixSocket 
  ? (process.env.USER || 'postgres')  // Для Unix socket - текущий пользователь системы
  : (dbConfig.user || process.env.USER || 'postgres');  // Для TCP/IP - из URL или текущий

// Конфигурация подключения к базе данных
interface PoolConfig {
  host: string;
  port?: number;
  database: string;
  user: string;
  password?: string;
}

const poolConfig: PoolConfig = useUnixSocket ? {
  // Peer authentication через Unix socket
  host: '/var/run/postgresql',
  database: dbConfig.database,
  user: dbUser,
} : {
  // TCP/IP подключение
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbUser,
};

// Добавляем пароль только если он указан и не пустой (для TCP/IP)
if (!useUnixSocket && password && password.trim() !== '') {
  poolConfig.password = password;
}

// #region agent log
fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:77',message:'before Pool creation',data:{config:poolConfig,useUnixSocket},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion
export const pool = new Pool(poolConfig);
// #region agent log
fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:80',message:'Pool created successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
// #endregion

// Обработка ошибок подключения
pool.on('error', (err) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/6a1252a5-d152-4553-840b-f256032862b6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'database.ts:85',message:'Pool error event',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});
