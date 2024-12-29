# LesDechets

---

## Run application

1. Clone repository. `git clone <url>`
2. Make the virtual environnement. `python -m venv .venv`
3. Lauch virtual environnement. `source ./.venv/bin/activate`
4. Install python libraries. `pip install -r requierement.txt`
5. Install dependancies. `sudo apt-get install libgl1-mesa-glx`
6. Download AI models with `.keras` and `.npy` files.
7. Make `models` directory.
8. Move AI models files in `models` directory.
9. Lauch application. `python app.py`

## Create service application
1. Create application workdirectory. `mkdir /opt/lesdechets`
2. Go to the workspace. `cd /opt/lesdechets`
3. Clone repository. `git clone <url>`
4. Create service file. `sudo nano /etc/systemd/system/lesdechets.service`
```
[Unit]
Description=Mon Application
After=network.target

[Service]
Type=simple
User=debian
Group=debian

WorkingDirectory=/opt/lesdechets

ExecStart=bash /opt/lesdechets/run_app.sh

Restart=always
RestartSec=5

PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true

[Install]
WantedBy=multi-user.target
```
5. Enable application service. `sudo systemctl enable lesdechets.service`
6. Restart daemon systemd. `sudo systemctl daemon-reload`
7. Install nginx.
8. Create nginx route. `sudo nano /etc/nginx/sites-available/lesdechets_app`
```
server {
    listen 80;
    server_name redmine.noventaris.fr;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
9. Enable route. `sudo ln -s /etc/nginx/sites-available/lesdechets_app /etc/nginx/sites-enabled
10. Enable configuration.
```bash
sudo nginx -t
sudo systemctl reload nginx
```
13. Certificate application access. `sudo certbot --nginx -d <yourdomain.com>`
