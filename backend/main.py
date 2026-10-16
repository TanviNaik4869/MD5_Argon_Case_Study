
import hashlib
import hmac

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

app = FastAPI(title="CryptoLab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

ph = PasswordHasher()

WORDLIST = [
    "123456", "password", "password123",
    "admin", "admin123", "qwerty", "letmein"
]


class PasswordInput(BaseModel):
    password: str = Field(min_length=1, max_length=128)


class HashInput(BaseModel):
    md5_hash: str = Field(pattern=r"^[a-fA-F0-9]{32}$")


class VerifyInput(BaseModel):
    password: str = Field(min_length=1, max_length=128)
    password_hash: str = Field(min_length=1, max_length=1024)


@app.get("/api/health")
def health():
    return {"status": "online", "application": "CryptoLab"}


@app.post("/api/md5")
def generate_md5(data: PasswordInput):
    digest = hashlib.md5(
        data.password.encode("utf-8"),
        usedforsecurity=False,
    ).hexdigest()

    return {
        "algorithm": "MD5",
        "hash": digest,
        "warning": "MD5 is not suitable for password storage."
    }


@app.post("/api/crack")
def dictionary_attack(data: HashInput):
    target = data.md5_hash.lower()

    for index, candidate in enumerate(WORDLIST, start=1):
        candidate_hash = hashlib.md5(
            candidate.encode("utf-8"),
            usedforsecurity=False,
        ).hexdigest()

        if hmac.compare_digest(candidate_hash, target):
            return {
                "found": True,
                "password": candidate,
                "attempts": index,
                "message": "Password found in the test wordlist."
            }

    return {
        "found": False,
        "password": None,
        "attempts": len(WORDLIST),
        "message": "No match in this wordlist; this does not prove security."
    }


@app.post("/api/argon2/hash")
def hash_password(data: PasswordInput):
    return {
        "algorithm": "Argon2id",
        "hash": ph.hash(data.password),
        "message": "Store the encoded hash, not the original password."
    }


@app.post("/api/argon2/verify")
def verify_password(data: VerifyInput):
    try:
        valid = ph.verify(data.password_hash, data.password)
    except (VerifyMismatchError, VerificationError, ValueError):
        valid = False

    return {
        "verified": valid,
        "message": "Password matches." if valid
        else "Password does not match the stored hash."
    }
