FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Run migrations and start server
CMD python manage.py migrate && gunicorn server.wsgi:application --bind 0.0.0.0:8000

