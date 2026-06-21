import paramiko

host = "103.178.235.78"
user = "root"
password = "fullstack1707@"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    stdin, stdout, stderr = ssh.exec_command("docker ps | grep frontend")
    print(stdout.read().decode('utf-8'))
finally:
    ssh.close()
