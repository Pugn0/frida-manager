import frida
import os
import sys
import time

print("""\033[96m
███████╗██████╗ ██╗██████╗  █████╗
██╔════╝██╔══██╗██║██╔══██╗██╔══██╗
█████╗  ██████╔╝██║██║  ██║███████║
██╔══╝  ██╔══██╗██║██║  ██║██╔══██║
██║     ██║  ██║██║██████╔╝██║  ██║
╚═╝     ╚═╝  ╚═╝╚═╝╚═════╝ ╚═╝  ╚═╝

Multi-Spawn Universal Loader
Telegram: @pugno_fc
""")

# =============================
# ENUMERAR DISPOSITIVOS
# =============================
try:
    devices = frida.enumerate_devices()
except Exception as e:
    print(f"\033[31m[ERRO] Falha ao enumerar dispositivos: {e}\033[0m")
    sys.exit(1)

if not devices:
    print("\033[31m[ERRO] Nenhum dispositivo encontrado.\033[0m")
    sys.exit(1)

while True:
    print("\033[37mDispositivos disponíveis:")
    for i, d in enumerate(devices):
        print(f"\033[32m{i+1}. {d}")

    try:
        choice = int(input("\033[37mSelecione o dispositivo: ")) - 1
        device = devices[choice]
        print(f"\033[36m[✓] Usando: {device.name}\033[0m")
        break
    except (ValueError, IndexError):
        print("\033[31mEscolha inválida.\033[0m")

# =============================
# CARREGAR SCRIPT JS
# =============================
script_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scripts")
js_files = [f for f in os.listdir(script_dir) if f.endswith(".js")]

if not js_files:
    print("\033[31m[ERRO] Nenhum .js encontrado em /scripts\033[0m")
    sys.exit(1)

print("\nScripts disponíveis:")
for i, f in enumerate(js_files):
    print(f"\033[94m{i+1}. {f}")

while True:
    try:
        idx = int(input("\033[37mEscolha o script JS: ")) - 1
        script_path = os.path.join(script_dir, js_files[idx])
        break
    except (ValueError, IndexError):
        print("\033[31mOpção inválida.\033[0m")

with open(script_path, "r", encoding="utf8") as f:
    JS_CODE = f.read()

# =============================
# CALLBACKS
# =============================
def on_message(message, data):
    if message["type"] == "send":
        print(f"\033[33m[{message.get('pid','?')}] {message['payload']}\033[0m")
    elif message["type"] == "error":
        print(f"\033[31m[JS ERROR] {message['description']}\033[0m")
    else:
        print(message)

def spawn_added(spawn):
    print(f"\033[32m[+] Spawn: {spawn.identifier} | PID {spawn.pid}\033[0m")

    try:
        session = device.attach(spawn.pid)
        script = session.create_script(JS_CODE)

        script.on("message", lambda m, d: on_message(
            {**m, "pid": spawn.pid}, d
        ))

        script.load()
    except frida.TransportError:
        print("\033[31m[!] Falha de transporte (versão ou frida-server)\033[0m")
    except Exception as e:
        print(f"\033[31m[!] Erro ao injetar: {e}\033[0m")

    try:
        device.resume(spawn.pid)
    except Exception:
        pass

# =============================
# SPAWN GATING
# =============================
device.on("spawn-added", spawn_added)

try:
    device.enable_spawn_gating()
    print("\033[36m[✓] Spawn gating ATIVO (multi-spawn)\033[0m")
except frida.PermissionDeniedError:
    print("\033[31m[ERRO] ROOT necessário para spawn gating.\033[0m")
    sys.exit(1)
except frida.TransportError:
    print("\033[31m[ERRO] frida-server não acessível.\033[0m")
    sys.exit(1)

print("\n[*] Monitorando TODOS os processos (CTRL+C para sair)\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\n[*] Encerrando...")
