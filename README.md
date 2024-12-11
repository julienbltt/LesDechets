# LesDechets

## Installation

### Setup application

1. Clone repository. `git clone <url>`
2. Make the virtual environnement. `python -m venv .venv`
3. Launch virtual environnement. `source ./.venv/bin/activate`
4. Install python libraries. `pip install -r requierement.txt`
5. Install dependancies. `sudo apt-get install libgl1-mesa-glx`
6. Download AI models `.keras` and class file `.npy`.
7. Make `models` directory.
8. Move AI models and class files in `models` directory.

> Tips : Clone the repository in `/opt` directory for more flexibility.

### Setup Web service

1. Install nginx. `sudo apt intall nginx`
2. Setup configuration file for application redirection. `sudo nano /etc/nginx/sites-available/lesdechets_app`
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
3. Enable configuration
`sudo ln -s /etc/nginx/sites-available/flask_app /etc/nginx/sites-enabled`
`sudo nginx -t`
`sudo systemctl reload nginx`
4. Install client ASME. `sudo apt install certbot python3-certbot-nginx`
5. Launch client ASME. `sudo certbot --nginx -d yourdomain.com`

### Launch application

Enter this command with the virtual python environement cli : `python path/to/LesDechets/app.py`
