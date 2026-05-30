/**
 * Local development server — runs the Hono app on Node.js with a SQLite-backed
 * D1 shim so workerd / wrangler dev is not required.
 */
import { serve } from '@hono/node-server';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Locate the wrangler local D1 SQLite file ───────────────────────────────
const stateDir = path.resolve(
  __dirname,
  '..',
  '.wrangler/state/v3/d1/miniflare-D1DatabaseObject',
);

function findSqliteFile(): string {
  if (!fs.existsSync(stateDir)) {
    throw new Error(
      `Local D1 state not found.\nRun these first:\n` +
        `  pnpm wrangler d1 execute fifa-jersey-shop --file=../../db/schema.sql --local\n` +
        `  pnpm wrangler d1 execute fifa-jersey-shop --file=../../db/seed.sql --local`,
    );
  }
  const files = fs.readdirSync(stateDir).filter((f) => f.endsWith('.sqlite'));
  if (!files.length) throw new Error(`No .sqlite file in ${stateDir}`);
  return path.join(stateDir, files[0]);
}

// ── SQLite → D1Database shim ───────────────────────────────────────────────
function createD1Shim(db: Database.Database): D1Database {
  const makeStmt = (query: string, bound: unknown[] = []) => ({
    bind: (...values: unknown[]) => makeStmt(query, values),

    first: async <T = unknown>(): Promise<T | null> => {
      const row = db.prepare(query).get(...bound) as T | undefined;
      return row ?? null;
    },

    run: async () => {
      const info = db.prepare(query).run(...bound);
      return { success: true, meta: { changes: info.changes, last_row_id: info.lastInsertRowid } };
    },

    all: async <T = unknown>() => {
      const rows = db.prepare(query).all(...bound) as T[];
      return { results: rows, success: true, meta: {} };
    },

    raw: async <T = unknown[]>() => {
      return db.prepare(query).raw().all(...bound) as T[];
    },
  });

  return {
    prepare: (query: string) => makeStmt(query) as unknown as D1PreparedStatement,
    batch: async (stmts: D1PreparedStatement[]) =>
      Promise.all(stmts.map((s: any) => s.run())),
    dump: async () => new ArrayBuffer(0),
    exec: async (query: string) => {
      db.exec(query);
      return { count: 1, duration: 0 };
    },
  } as unknown as D1Database;
}

// ── Boot ────────────────────────────────────────────────────────────────────
const sqliteFile = findSqliteFile();
const db = new Database(sqliteFile);
db.pragma('journal_mode = WAL');
const d1 = createD1Shim(db);

const bindings = {
  DB: d1,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? '',
  RESEND_API_KEY: process.env.RESEND_API_KEY ?? '',
  BASE_PATH: '/api',
};

const execCtx = {
  waitUntil: (_p: Promise<unknown>) => {},
  passThroughOnException: () => {},
} as ExecutionContext;

const { default: app } = await import('./index.js');

const port = Number(process.env.PORT ?? 8080);

serve(
  {
    fetch: (req) => app.fetch(req, bindings, execCtx),
    port,
  },
  (info) => {
    console.log(`[dev] API ready on http://localhost:${info.port}`);
    console.log(`[dev] D1 SQLite: ${path.relative(process.cwd(), sqliteFile)}`);
  },
);
