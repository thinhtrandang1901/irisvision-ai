from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
import joblib
import numpy as np
import os
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.starlette_client import OAuth


# =========================
# TẠO ỨNG DỤNG FASTAPI
# =========================

app = FastAPI(
    title="Iris SVM Classifier API",
    description="API phân loại hoa Iris bằng Linear SVM",
    version="1.0.0"
)


# =========================
# ĐƯỜNG DẪN CÁC THƯ MỤC
# =========================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MODEL_PATH = os.path.join(
    BASE_DIR,
    "models",
    "svm_iris_linear.pkl"
)

TEMPLATES_DIR = os.path.join(
    BASE_DIR,
    "app",
    "templates"
)

STATIC_DIR = os.path.join(
    BASE_DIR,
    "app",
    "static"
)


# =========================
# LOAD MODEL
# =========================

model = joblib.load(MODEL_PATH)


# =========================
# CẤU HÌNH HTML + CSS + JS
# =========================

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static"
)

templates = Jinja2Templates(
    directory=TEMPLATES_DIR
)


# =========================
# TÊN 3 LOÀI HOA
# =========================

class_names = [
    "setosa",
    "versicolor",
    "virginica"
]


# =========================
# DỮ LIỆU ĐẦU VÀO
# =========================

class IrisInput(BaseModel):
    sepal_length: float
    sepal_width: float
    petal_length: float
    petal_width: float


# =========================
# TRANG WEB CHÍNH
# =========================

@app.get("/", response_class=HTMLResponse)
def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


# =========================
# KIỂM TRA SERVER
# =========================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# =========================
# API DỰ ĐOÁN
# =========================

@app.post("/predict")
def predict(data: IrisInput):

    input_data = np.array([
        [
            data.sepal_length,
            data.sepal_width,
            data.petal_length,
            data.petal_width
        ]
    ])

    prediction = model.predict(input_data)[0]

    probabilities = model.predict_proba(input_data)[0]

    result = {

        "prediction": class_names[prediction],

        "probabilities": {
            class_names[i]: round(
                float(probabilities[i]),
                4
            )

            for i in range(len(class_names))
        }
    }

    return result
