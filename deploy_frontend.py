import paramiko
import os

host = "103.178.235.78"
user = "root"
password = "fullstack1707@"

local_file = r"d:\FullStack_API-web-API\FullStack_API-web-API\frontend\src\views\ProjectDetailView.vue"
remote_file = "/root/FullStack_API/frontend/src/views/ProjectDetailView.vue"
remote_base = "/root/FullStack_API"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    sftp = ssh.open_sftp()
    
    print(f"Uploading {local_file} to {remote_file}")
    sftp.put(local_file, remote_file)
    sftp.close()
    
    print("File uploaded. Rebuilding frontend docker container...")
    
    # Run docker build and restart
    cmd = f"cd {remote_base} && docker compose build frontend && docker compose up -d frontend"
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    exit_status = stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
    print("Exit status:", exit_status)

    if exit_status != 0:
        print("Fallback to docker-compose...")
        cmd2 = f"cd {remote_base} && docker-compose build frontend && docker-compose up -d frontend"
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        exit_status2 = stdout.channel.recv_exit_status()
        print("STDOUT2:", stdout.read().decode())
        print("STDERR2:", stderr.read().decode())

finally:
    ssh.close()
