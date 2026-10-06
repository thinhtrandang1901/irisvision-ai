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
# SESSION ĐĂNG NHẬP
# =========================

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv(
        "SESSION_SECRET",
        "dev-secret-change-me"
    ),
    same_site="lax",
    https_only=False,
    max_age=60 * 60 * 24 * 7
)
# =========================
# GOOGLE OAUTH
# =========================

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url=(
        "https://accounts.google.com/"
        ".well-known/openid-configuration"
    ),
    client_kwargs={
        "scope": "openid email profile"
    }
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
# LẤY TÀI KHOẢN ĐĂNG NHẬP
# =========================

def get_current_user(request: Request):
    return request.session.get("user")

# =========================
# TRANG WEB CHÍNH
# =========================

@app.get("/", response_class=HTMLResponse)
def home(request: Request):

    user = get_current_user(request)

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "user": user
        }
    )
# =========================
# BẮT ĐẦU ĐĂNG NHẬP GOOGLE
# =========================

@app.get("/auth/google")
async def google_login(request: Request):

    redirect_uri = os.getenv(
        "GOOGLE_REDIRECT_URI"
    )

    if not redirect_uri:
        raise HTTPException(
            status_code=500,
            detail="GOOGLE_REDIRECT_URI chưa được cấu hình."
        )

    return await oauth.google.authorize_redirect(
        request,
        redirect_uri
    )
# =========================
# GOOGLE CALLBACK
# =========================

@app.get("/auth/google/callback")
async def google_callback(request: Request):

    try:

        token = await oauth.google.authorize_access_token(
            request
        )

        userinfo = token.get("userinfo")

        if not userinfo:
            raise ValueError(
                "Không nhận được thông tin tài khoản Google."
            )

        request.session["user"] = {
            "name": userinfo.get(
                "name",
                "Google User"
            ),
            "email": userinfo.get(
                "email",
                ""
            ),
            "picture": userinfo.get(
                "picture",
                ""
            )
        }

        return RedirectResponse(
            url="/",
            status_code=303
        )

    except Exception as e:

        print(
            "Google OAuth error:",
            repr(e)
        )

        return RedirectResponse(
            url="/?auth_error=oauth_failed",
            status_code=303
        )
# =========================
# ĐĂNG XUẤT
# =========================

@app.get("/logout")
def logout(request: Request):

    request.session.clear()

    return RedirectResponse(
        url="/",
        status_code=303
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
def predict(
    data: IrisInput,
    request: Request
):

    user = get_current_user(request)

    if not user:
        raise HTTPException(
            status_code=401,
            detail=(
                "Bạn phải đăng nhập bằng "
                "Google trước khi dự đoán."
            )
        )

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
