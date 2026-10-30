from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import flats
from app.routers import streets
from app.routers import houses
from app.routers import fees
from app.routers import payments
from app.routers import discounts
from app.routers import xml_parking_compare

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.40.10.28:5173", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(flats.router)
app.include_router(streets.router)
app.include_router(houses.router)
app.include_router(fees.router)
app.include_router(payments.router)
app.include_router(discounts.router)
app.include_router(xml_parking_compare.router)

@app.get("/")
def root():
    return {
        "message": "Сервер работает!"
    }

@app.get("/hello")
def hello():
    return {
        "text": "Привет!"
    }