import frida
import os
print("""\033[96m
'########::'##::::'##::'######:::'##::: ##::'#######::
 ##.... ##: ##:::: ##:'##... ##:: ###:: ##:'##.... ##:
 ##:::: ##: ##:::: ##: ##:::..::: ####: ##: ##:::: ##:
 ########:: ##:::: ##: ##::'####: ## ## ##: ##:::: ##:
 ##.....::: ##:::: ##: ##::: ##:: ##. ####: ##:::: ##:
 ##:::::::: ##:::: ##: ##::: ##:: ##:. ###: ##:::: ##:
 ##::::::::. #######::. ######::: ##::. ##:. #######::
..::::::::::.......::::......::::..::::..:::.......:::
Telegram: @pugno_fc          
 """)

devices = frida.enumerate_devices()

# Verifica se o dispositivo está disponível
while True:
    print("\033[37mDispositivos disponíveis:")
    for index, device in enumerate(devices):
        print(f"\033[32m{index + 1}. {device}")

    device_choice = input("\033[37mSelecione o dispositivo pelo número: ")

    try:
        # Imprime informações sobre o dispositivo selecionado
        selected_device = devices[int(device_choice) - 1]
        print(f"\033[36mDispositivo selecionado: {device.id} - {device.name} \033[37m")
        break
    except (ValueError, IndexError):
        print("\033[31mEscolha inválida. Tente novamente.")


device = selected_device


# Verifica se o arquivo do script existe
script_dir = os.path.dirname(os.path.abspath(__file__)) + "/scripts"
js_files = [f for f in os.listdir(script_dir) if f.endswith('.js')]

if not js_files:
    print("\033[91mNenhum arquivo .js encontrado no diretório de scripts\033[0m")
    exit()

print("Selecione o arquivo .js:")
for i, f in enumerate(js_files):
    print(f"\033[94m{i+1}. {f}")

while True:
    selected_file = input("\033[0mDigite o número correspondente ao arquivo: ")
    try:
        selected_file_index = int(selected_file) - 1
        if selected_file_index < 0 or selected_file_index >= len(js_files):
            raise ValueError
        break
    except ValueError:
        print("\033[91mOpção inválida. Tente novamente.\033[0m")

script_path = os.path.join(script_dir, js_files[selected_file_index])

# Lê o conteúdo do arquivo do script
with open(script_path, "r", encoding="utf8") as f:
    jscode = f.read()

# Função chamada sempre que um novo processo é criado
def spawn_added(spawn):
    print(f"[+] Novo processo criado:\033[93m {spawn}\033[37m")
    # Define o nome do pacote do aplicativo alvo
    target = spawn.identifier


    # Verifica se o processo é o alvo
    if spawn.identifier.startswith(target):
        # Anexa uma sessão do Frida ao processo
        print(f"[+] Anexando ao processo {spawn.pid}")
        session = device.attach(spawn.pid)

        # Cria um script e carrega o código do arquivo "antiroot.js"
        script = session.create_script(jscode)

        # Adiciona a função 'on_message' para lidar com as mensagens do script
        script.on('message', on_message)

        # Carrega o script e inicia a execução
        script.load()

    # Retoma o processo
    device.resume(spawn.pid)

# Função chamada sempre que uma mensagem é recebida do script injetado
def on_message(message, data):
    if message['type'] == 'send':
        # Imprime o payload da mensagem
        print("[*] Payload recebido: {0}".format(message['payload']))
    else:
        # Imprime a mensagem completa
        print(message)

# Adiciona a função 'spawn_added' para lidar com a criação de novos processos
device.on('spawn-added', spawn_added)

# Habilita a monitoração de novos processos criados
device.enable_spawn_gating()
print('Monitorando novos processos')

# Aguarda uma entrada do usuário para encerrar o programa
input()




'''
TABELA DE CORES

Vermelho: "\033[31m"
Verde: "\033[32m"
Amarelo: "\033[33m"
Azul: "\033[34m"
Magenta: "\033[35m"
Ciano: "\033[36m"
Branco: "\033[37m"
'''
