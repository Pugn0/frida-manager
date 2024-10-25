import subprocess
from termcolor import colored

def list_devices():
    try:
        result = subprocess.run(['adb', 'devices'], capture_output=True, text=True)
        devices = []
        for line in result.stdout.split('\n'):
            if '\tdevice' in line:
                devices.append(line.split('\t')[0])
        return devices
    except Exception as e:
        print(colored(f"Erro ao listar dispositivos: {str(e)}", 'red'))
        return []

def get_android_ip(device_id, interface='wlan0'):
    try:
        # Aqui, especificamos que queremos a saída da interface wlan0
        command = ['adb', '-s', device_id, 'shell', 'ip', '-f', 'inet', 'addr', 'show', interface]
        result = subprocess.run(command, capture_output=True, text=True)
        for line in result.stdout.split('\n'):
            if 'inet ' in line:
                ip = line.strip().split(' ')[1].split('/')[0]
                return ip
    except Exception as e:
        print(colored(f"Erro ao executar comando para obter IP: {str(e)}", 'red'))

def adb_connect(ip_address):
    try:
        full_address = f"{ip_address}:5555"
        result = subprocess.run(['adb', 'connect', full_address], capture_output=True, text=True)
        if "connected to" in result.stdout:
            print(colored(f"Conectado com sucesso ao dispositivo {full_address}", 'green'))
        else:
            print(colored(f"Falha ao conectar ao dispositivo {full_address}", 'red'))
    except Exception as e:
        print(colored(f"Erro na conexão: {str(e)}", 'red'))

def main():
    devices = list_devices()
    if not devices:
        print(colored("Nenhum dispositivo conectado.", 'red'))
        return

    print("Dispositivos detectados:")
    for idx, device in enumerate(devices):
        print(colored(f"{idx + 1}. {device}", 'yellow'))

    selection = input("Escolha um dispositivo pelo número, ou digite 'todos' para conectar a todos: ")
    if selection.isdigit():
        selected_device = devices[int(selection) - 1]
        ip_address = get_android_ip(selected_device)
        if ip_address:
            adb_connect(ip_address)
        else:
            print(colored("IP não encontrado para o dispositivo selecionado.", 'red'))
    elif selection.lower() == 'todos':
        for device in devices:
            ip_address = get_android_ip(device)
            if ip_address:
                adb_connect(ip_address)
            else:
                print(colored(f"IP não encontrado para o dispositivo {device}.", 'red'))

if __name__ == '__main__':
    main()
