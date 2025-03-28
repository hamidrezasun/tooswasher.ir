from fastapi import FastAPI
import uvicorn
from routes.user import router as user_router
from routes.product import router as product_router
from routes.cart import router as cart_router
from routes.page import router as page_router
from routes.category import router as category_router
from routes.order import router as order_router
from routes.discount import router as discount_router
from routes.payment import router as payment_router
from routes.event import router as event_router
from routes.files import router as file_router
from fastapi.middleware.cors import CORSMiddleware
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="طوس واشر",
    version="0.1",
    license_info={
        "name": "Apache 2.0",
        "url": "https://www.apache.org/licenses/LICENSE-2.0.html",
    },
)
app.mount("/api", app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(user_router)
app.include_router(product_router)
app.include_router(cart_router)
app.include_router(category_router)
app.include_router(page_router)
app.include_router(order_router)
app.include_router(discount_router)
app.include_router(payment_router)
app.include_router(event_router)
app.include_router(file_router)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)