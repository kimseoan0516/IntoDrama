# 파이썬 3.9 버전을 사용합니다
FROM python:3.11

# 작업 폴더를 설정합니다
WORKDIR /code

# 먼저 requirements.txt를 복사해서 라이브러리를 설치합니다
COPY ./requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# 나머지 코드 파일들을 복사합니다
COPY . /code
CMD ["sh", "-c", "export PYTHONPATH=$PYTHONPATH:/code/backend && uvicorn backend.main:app --host 0.0.0.0 --port 7860"]