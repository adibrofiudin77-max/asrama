from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
import db
from auth import router as auth_router, seed_admin
from routes_master import router as master_router
from routes_akademik import router as akademik_router
from routes_keuangan import router as keuangan_router
from legacy_import import import_legacy

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_pool()
    await db.execute((ROOT_DIR / "schema.sql").read_text())
    await import_legacy()
    await seed_admin()
    yield
    await db.close_pool()


app = FastAPI(lifespan=lifespan)
for r in (auth_router, master_router, akademik_router, keuangan_router):
    app.include_router(r)


@app.get("/api/")
async def root():
    return {"message": "Alhasani API"}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ["CORS_ORIGINS"].split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
