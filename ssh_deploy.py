import paramiko
import os

host = "103.178.235.78"
user = "root"
password = "fullstack1707@"

local_base = r"c:\Users\Admin\FullStack-12"
remote_base = "/root/FullStack-12"

files_to_upload = [
    r"ProjectMemberService\Controllers\SystemUsersController.cs",
    r"ProjectMemberService\Controllers\PermissionsController.cs",
    r"ProjectMemberService\Services\PermissionService.cs"
]

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(host, username=user, password=password)
    sftp = ssh.open_sftp()
    
    for file in files_to_upload:
        local_path = os.path.join(local_base, file)
        remote_path = f"{remote_base}/{file.replace(chr(92), '/')}"
        print(f"Uploading {local_path} to {remote_path}")
        sftp.put(local_path, remote_path)
    
    sftp.close()
    
    print("Files uploaded. Rebuilding docker container...")
    
    # Run docker build and restart
    cmd = f"cd {remote_base} && docker compose build n1-project-member-service && docker compose up -d n1-project-member-service"
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    
    # Wait for command to finish and print output
    exit_status = stdout.channel.recv_exit_status()
    print("STDOUT:", stdout.read().decode())
    print("STDERR:", stderr.read().decode())
    print("Exit status:", exit_status)

    if exit_status != 0:
        print("Fallback to normal docker build if docker compose fails...")
        cmd2 = f"cd {remote_base} && docker-compose build n1-project-member-service && docker-compose up -d n1-project-member-service"
        stdin, stdout, stderr = ssh.exec_command(cmd2)
        exit_status2 = stdout.channel.recv_exit_status()
        print("STDOUT2:", stdout.read().decode())
        print("STDERR2:", stderr.read().decode())
        
        # If the service name is different in compose, maybe we just rebuild all or restart all
        if exit_status2 != 0:
             cmd3 = f"cd {remote_base} && docker-compose build && docker-compose up -d"
             stdin, stdout, stderr = ssh.exec_command(cmd3)
             print("STDOUT3:", stdout.read().decode())
             print("STDERR3:", stderr.read().decode())

finally:
    ssh.close()
