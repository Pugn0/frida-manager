import subprocess
import sys
import os

# Função para limpar o console
def clear_console():
    # Limpar o console de acordo com o sistema operacional
    os.system('cls' if os.name == 'nt' else 'clear')

# Tentar importar o módulo requests
try:
    import requests
except ImportError:
    libraries = [
        'urllib3',
        'requests'
    ]

    # Instalação das bibliotecas
    for library in libraries:
        try:
            subprocess.check_call([sys.executable, '-m', 'pip', 'install', library])
            print(f'{library} instalada com sucesso!')
        except subprocess.CalledProcessError:
            print(f'Erro ao instalar {library}.')
    
    # Limpar o console após a instalação
    clear_console()

    try:
        import requests  # Tente importar novamente após a instalação
    except ImportError:
        print('Erro: Não foi possível importar o módulo requests após a instalação.')

# Demais imports
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
        
def start_frida_server(devices):
    for device in devices:
        # Listar arquivos no diretório /data/local/tmp
        print(f"Listando arquivos no diretório /data/local/tmp do dispositivo {device}...")
        command_list_files = f"adb -s {device} shell ls /data/local/tmp"
        result = subprocess.run(command_list_files, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Erro ao listar arquivos no diretório /data/local/tmp: {result.stderr}")
            continue
        
        files = result.stdout.splitlines()
        if not files:
            print(f"Nenhum arquivo encontrado no diretório /data/local/tmp no dispositivo {device}.")
            continue

        # Exibir arquivos disponíveis
        print(f"Arquivos disponíveis no dispositivo {device}:")
        for idx, file in enumerate(files):
            print(f"{idx + 1}: {file}")

        # Solicitar a seleção do arquivo a ser iniciado
        selected_file_index = input("Digite o número do arquivo que deseja iniciar: ")
        if not selected_file_index.isdigit() or int(selected_file_index) - 1 not in range(len(files)):
            print("Seleção inválida. Pulando para o próximo dispositivo.")
            continue
        
        selected_file = files[int(selected_file_index) - 1]
        print(f"Arquivo selecionado: {selected_file}")

        # Definir permissões e iniciar o arquivo selecionado
        subprocess.run(['adb', '-s', device, 'shell', 'chmod', '755', f'/data/local/tmp/{selected_file}'], check=True)
        print(f"Iniciando {selected_file} no dispositivo {device}...")
        subprocess.Popen(['adb', '-s', device, 'shell', f'cd /data/local/tmp; ./{selected_file} &'])
        
    # Perguntar ao usuário se deseja fechar o terminal
    should_close = input("Deseja fechar o terminal? (s/n): ").lower()
    if should_close == 's':
        print("Fechando o terminal...")
    else:
        print("Terminal mantido aberto.")
        
        
        
def stop_frida_server(devices):
    for device in devices:
        # Listar arquivos no diretório /data/local/tmp
        print(f"Listando arquivos no diretório /data/local/tmp do dispositivo {device}...")
        command_list_files = f"adb -s {device} shell ls /data/local/tmp"
        result = subprocess.run(command_list_files, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"Erro ao listar arquivos no diretório /data/local/tmp: {result.stderr}")
            continue
        
        files = result.stdout.splitlines()
        if not files:
            print(f"Nenhum arquivo encontrado no diretório /data/local/tmp no dispositivo {device}.")
            continue

        # Exibir arquivos disponíveis
        print(f"Arquivos disponíveis no dispositivo {device}:")
        for idx, file in enumerate(files):
            print(f"{idx + 1}: {file}")

        # Solicitar a seleção do arquivo para matar o processo
        selected_file_index = input("Digite o número do arquivo cujo processo deseja matar: ")
        if not selected_file_index.isdigit() or int(selected_file_index) - 1 not in range(len(files)):
            print("Seleção inválida. Pulando para o próximo dispositivo.")
            continue
        
        selected_file = files[int(selected_file_index) - 1]
        print(f"Arquivo selecionado: {selected_file}")

        # Listar processos com base no arquivo selecionado
        command_list_processes = f"adb -s {device} shell ps"
        result_processes = subprocess.run(command_list_processes, shell=True, capture_output=True, text=True)

        if result_processes.returncode != 0:
            print(f"Erro ao listar processos: {result_processes.stderr}")
            continue
        
        processes = result_processes.stdout.splitlines()
        matching_processes = [process for process in processes if selected_file in process]

        if not matching_processes:
            print(f"Nenhum processo encontrado para o arquivo {selected_file} no dispositivo {device}.")
            continue

        # Exibir processos encontrados
        print(f"Processos encontrados para {selected_file}:")
        for idx, process in enumerate(matching_processes):
            print(f"{idx + 1}: {process}")

        # Solicitar a seleção do processo a ser encerrado
        selected_process_index = input("Digite o número do processo que deseja matar: ")
        if not selected_process_index.isdigit() or int(selected_process_index) - 1 not in range(len(matching_processes)):
            print("Seleção inválida. Pulando para o próximo dispositivo.")
            continue
        
        selected_process = matching_processes[int(selected_process_index) - 1]
        # Obter o PID do processo selecionado
        pid = selected_process.split()[1]  # Normalmente, o PID é o segundo elemento na saída do ps
        print(f"Matando o processo com PID: {pid}")

        # Matar o processo selecionado
        subprocess.run(['adb', '-s', device, 'shell', 'kill', pid], check=True)
        print(f"Processo com PID {pid} encerrado com sucesso no dispositivo {device}.")
    
    # Perguntar ao usuário se deseja fechar o terminal
    should_close = input("Deseja fechar o terminal? (s/n): ").lower()
    if should_close == 's':
        print("Fechando o terminal...")
    else:
        print("Terminal mantido aberto.")

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
    print("................................................")
    print(".    T O O L S    -    FRIDA MANAGER           .")
    print("................................................")
    print("[1] - Instalar Frida Server")
    print("[2] - Instalar Frida Tools")
    print("[3] - Iniciar Frida Server")
    print("[4] - Stop Frida Server")
    print("[5] - Remover Frida Server")
    print("[6] - Reiniciar Dispositivos")
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
        start_frida_server(selected_devices)
    elif choice == '4':
        devices = list_devices()
        selected_devices = select_devices(devices)
        stop_frida_server(selected_devices)
    elif choice == '5':
        devices = list_devices()
        selected_devices = select_devices(devices)
        remove_frida_server(selected_devices)
    elif choice == '6':
        devices = list_devices()
        selected_devices = select_devices(devices)
        restart_devices(selected_devices)


if __name__ == '__main__':
    main_menu()
