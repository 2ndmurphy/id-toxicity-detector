# Machine Learning Backend

# Prerequisite

- API Project kita pakai `fastAPI` dan `uvivorn` package
  - [https://fastapi.tiangolo.com]( https://fastapi.tiangolo.com)
  - `uv add fastapi uvicorn`
- Command
  - cd ke `ml-backend` lalu,
  - `uvicorn api:app --reload`
  - `python -m uvicorn app.api:app --reload` (run server)
  - `app.api`: Path ke file `api.py`, dimulai dari nama folder (app) tanpa ekstensi `.py`.
  - `app`: Nama instance FastAPI yang dideklarasikan di main.py.
  - `--reload`: Memuat ulang server secara otomatis saat ada perubahan kode (cocok untuk pengembangan).

# Todos

- [*] Setup dan konfigurasi awal
- [*] Server berhasil running di PORT [8000]
- [ ] Buat endpoint ke model
- [ ] ???
