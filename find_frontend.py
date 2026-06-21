import paramiko
import os

host = "103.178.235.78"
user = "root"
password = "fullstack1707@"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("find / -name ProjectDetailView.vue 2>/dev/null")
    print("ProjectDetailView.vue locations:", stdout.read().decode().strip())
finally:
    ssh.close()
