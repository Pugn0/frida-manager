import subprocess
import requests
import os
import lzma

def get_device_architecture(device_id):
    cmd = ['adb', '-s', device_id, 'shell', 'getprop', 'ro.product.cpu.abi']
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception("Falha ao obter a arquitetura do dispositivo")
    return result.stdout.strip()

def download_frida_server(architecture):
    print("Verificando a última versão do Frida Server...")
    base_url = "https://api.github.com/repos/frida/frida/releases/latest"
    response = requests.get(base_url)
    response.raise_for_status()
    data = response.json()
    
    file_name = f"frida-server-{data['tag_name']}-android-{architecture}.xz"
    for asset in data['assets']:
        if asset['name'] == file_name:
            print(f"Baixando {asset['name']}...")
            r = requests.get(asset['browser_download_url'])
            with open(asset['name'], 'wb') as f:
                f.write(r.content)
            return asset['name']
    raise Exception("Frida Server não encontrado para a arquitetura fornecida.")

def extract_and_cleanup(file_name):
    print("Extraindo o Frida Server...")
    with lzma.open(file_name) as f:
        content = f.read()
    extracted_name = 'frida-server'
    with open(extracted_name, 'wb') as f:
        f.write(content)
    os.remove(file_name)
    return extracted_name

def install_frida_tools():
    print("Instalando frida-tools...")
    subprocess.run(['pip', 'install', 'frida-tools'], check=True)
    print("frida-tools instalado com sucesso.")

def list_devices():
    result = subprocess.run(['adb', 'devices'], capture_output=True, text=True)
    lines = result.stdout.splitlines()
    devices = [line.split()[0] for line in lines if "device" in line and not line.startswith("List of devices attached")]
    return devices

def select_devices(devices):
    print("Dispositivos disponíveis:")
    for idx, device in enumerate(devices):
        print(f"{idx + 1}: {device}")
    selected = input("Digite os números dos dispositivos (separados por vírgula) ou 'todos': ")
    if selected.lower() == 'todos':
        return devices
    selected_indices = [int(i) - 1 for i in selected.split(',') if i.isdigit()]
    return [devices[i] for i in selected_indices if i < len(devices)]

def push_and_start_frida_server(devices, server_path):
    if not os.path.exists(server_path):
        print(f"Erro: O arquivo {server_path} não foi encontrado no diretório atual.")
        return
    for device in devices:
        print(f"Transferindo o Frida Server para o dispositivo {device}...")
        subprocess.run(['adb', '-s', device, 'push', server_path, '/data/local/tmp/frida-server'], check=True)
        print(f"Configurando permissões no dispositivo {device}...")
        subprocess.run(['adb', '-s', device, 'shell', 'chmod', '755', '/data/local/tmp/frida-server'], check=True)
        print(f"Iniciando Frida Server no dispositivo {device}...")
        subprocess.Popen(['adb', '-s', device, 'shell', 'cd /data/local/tmp; ./frida-server &'])
        print("Frida Server iniciado nos dispositivos selecionados.")

def remove_frida_server(devices):
    for device in devices:
        print(f"Tentando remover o Frida Server do dispositivo {device}...")
        result = subprocess.run(['adb', '-s', device, 'shell', 'rm', '/data/local/tmp/frida-server'], capture_output=True, text=True, check=False)
        if result.returncode != 0:
            if "No such file or directory" in result.stderr:
                print(f"Frida Server não encontrado no dispositivo {device}.")
            else:
                print(f"Erro ao remover o Frida Server do dispositivo {device}: {result.stderr}")
        else:
            print(f"Frida Server removido com sucesso do dispositivo {device}.")

def restart_devices(devices):
    for device in devices:
        print(f"Reiniciando o dispositivo {device}...")
        subprocess.run(['adb', '-s', device, 'reboot'], check=True)
        print(f"Dispositivo {device} está sendo reiniciado.")

def main_menu():
    print("1 - Instalar Frida Server")
    print("2 - Instalar Frida Tools")
    print("3 - Iniciar Frida Server")
    print("4 - Remover Frida Server")
    print("5 - Reiniciar Dispositivos")
    choice = input("Escolha uma opção: ")
    if choice == '1':
        devices = list_devices()
        selected_devices = select_devices(devices)
        for device in selected_devices:
            architecture = get_device_architecture(device)
            file_name = download_frida_server(architecture)
            extracted_name = extract_and_cleanup(file_name)
            push_and_start_frida_server([device], extracted_name)
            os.remove(extracted_name)
    elif choice == '2':
        install_frida_tools()
    elif choice == '3':
        devices = list_devices()
        selected_devices = select_devices(devices)
        push_and_start_frida_server(selected_devices, 'frida-server')
    elif choice == '4':
        devices = list_devices()
        selected_devices = select_devices(devices)
        remove_frida_server(selected_devices)
    elif choice == '5':
        devices = list_devices()
        selected_devices = select_devices(devices)
        restart_devices(selected_devices)

if __name__ == '__main__':
    main_menu()
