import shutil
import frida
import os
from colorama import init, Fore, Style

# Inicializar o colorama para suportar cores no terminal do Windows
init(autoreset=True)

def print_centered_banner(title, telegram_handle, tool_name):
    # Definir limites de comprimento
    max_title_length = 66
    max_content_length = 50  # Comprimento para "Telegram" e "Tool"

    # Garantir que os textos não ultrapassem o limite
    title = title[:max_title_length]
    telegram_handle = telegram_handle[:max_content_length // 2]
    tool_name = tool_name[:max_content_length // 2]

    # Obter largura do terminal para centralizar o banner
    terminal_width = shutil.get_terminal_size().columns

    # Formatar a linha central com centralização proporcional
    content_line = f"[ {telegram_handle} | {tool_name} ]"
    centered_content = content_line.center(max_title_length)

    # Banner com espaços reservados para os argumentos
    banner_template = f"""
########################################################################
#                                                                      #
                       {title.center(max_title_length)}                       
#                                                                      #
                {centered_content}                
#                                                                      #
########################################################################\n
"""

    # Centralizar o banner no terminal
    centered_banner = "\n".join(line.center(terminal_width) for line in banner_template.splitlines())

    print(centered_banner)

print_centered_banner(f"Frida Spaw Hook", "Telegram: @pugno_yt", "Tool: frida-spaw-hook")

devices = frida.enumerate_devices()

# Verifica se o dispositivo está disponível
while True:
    print(Fore.WHITE + "Dispositivos disponíveis:")
    for i, device in enumerate(devices, start=1):
        print(f"{Fore.CYAN}[{Fore.GREEN}{i:02}{Fore.CYAN}]{Style.RESET_ALL} - {Fore.BLUE}{device}{Style.RESET_ALL}")

    device_choice = input(Fore.WHITE + "Selecione o dispositivo pelo número: ")

    try:
        selected_device = devices[int(device_choice) - 1]
        print(f"{Fore.CYAN}Dispositivo selecionado: {selected_device.id} - {selected_device.name} {Fore.RESET}")
        break
    except (ValueError, IndexError):
        print(Fore.RED + "Escolha inválida. Tente novamente.")

device = selected_device

# Verifica se o arquivo do script existe
script_dir = os.path.dirname(os.path.abspath(__file__)) + "/scripts"
js_files = [f for f in os.listdir(script_dir) if f.endswith('.js')]

if not js_files:
    print(Fore.RED + "Nenhum arquivo .js encontrado no diretório de scripts")
    exit()

print("Selecione o arquivo .js:")
for i, f in enumerate(js_files, start=1):
    print(f"{Fore.CYAN}[{Fore.GREEN}{i:02}{Fore.CYAN}]{Style.RESET_ALL} - {Fore.BLUE}{f}{Style.RESET_ALL}")


while True:
    selected_file = input(Fore.WHITE + "Digite o número correspondente ao arquivo: ")
    try:
        selected_file_index = int(selected_file) - 1
        if selected_file_index < 0 or selected_file_index >= len(js_files):
            raise ValueError
        break
    except ValueError:
        print(Fore.RED + "Opção inválida. Tente novamente.")

script_path = os.path.join(script_dir, js_files[selected_file_index])

# Lê o conteúdo do arquivo do script
with open(script_path, "r", encoding="utf8") as f:
    jscode = f.read()

# Função chamada sempre que um novo processo é criado
def spawn_added(spawn):
    print(f"[+] Novo processo criado: {Fore.YELLOW}{spawn}{Fore.WHITE}")
    target = spawn.identifier

    # Verifica se o processo é o alvo
    if spawn.identifier.startswith(target):
        print(f"[+] Anexando ao processo {spawn.pid}")
        session = device.attach(spawn.pid)

        # Cria um script e carrega o código do arquivo JS
        script = session.create_script(jscode)
        script.on('message', on_message)
        script.load()

    # Retoma o processo
    device.resume(spawn.pid)

# Função chamada sempre que uma mensagem é recebida do script injetado
def on_message(message, data):
    if message['type'] == 'send':
        print(Fore.GREEN + "[*] Payload recebido: {0}".format(message['payload']))
    else:
        print(Fore.RED + str(message))

# Adiciona a função 'spawn_added' para lidar com a criação de novos processos
device.on('spawn-added', spawn_added)
device.enable_spawn_gating()
print(Fore.WHITE + 'Monitorando novos processos')

# Aguarda uma entrada do usuário para encerrar o programa
input()
