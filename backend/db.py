import os
import asyncpg

_pool = None


async def init_pool():
    global _pool
    schema = os.environ.get("DB_SCHEMA", "public")
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    await conn.execute(f'CREATE SCHEMA IF NOT EXISTS "{schema}"')
    await conn.close()
    _pool = await asyncpg.create_pool(os.environ["DATABASE_URL"], min_size=3, max_size=10,
                                      server_settings={"search_path": schema})


async def close_pool():
    await _pool.close()


def pool():
    return _pool


async def fetch(q, *a):
    return [dict(r) for r in await _pool.fetch(q, *a)]


async def fetchrow(q, *a):
    r = await _pool.fetchrow(q, *a)
    return dict(r) if r else None


async def fetchval(q, *a):
    return await _pool.fetchval(q, *a)


async def execute(q, *a):
    return await _pool.execute(q, *a)
