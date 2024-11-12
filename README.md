
# Frida Tools Collection

This repository contains two powerful Python scripts for managing and interacting with Frida Server on Android devices:

1. **Frida Server Management Tool (`frida-manager.py`)**: A tool to automate the management of Frida Server on Android devices using ADB (Android Debug Bridge).
2. **Frida Process Hooking Tool (`frida-spaw-hook.py`)**: A tool for dynamically monitoring and injecting JavaScript code into processes running on Android devices using Frida.

## Features

### Frida Server Management Tool (`frida-manager.py`)

- **Download the latest Frida Server**: Automatically fetches the most recent Frida Server based on the device architecture.
- **Extract and prepare Frida Server**: Extracts the downloaded Frida Server for use on Android devices.
- **Install Frida Tools**: Installs necessary Frida tools via pip.
- **Device management**: Lists connected Android devices and allows users to select devices for operation.
- **Push and start Frida Server**: Transfers and starts Frida Server on selected devices.
- **Start and stop Frida Server**: Initiates or terminates the Frida Server on chosen devices.
- **Remove Frida Server**: Deletes Frida Server from specified devices.
- **Restart devices**: Restarts selected Android devices.

### Frida Process Hooking Tool (`frida-spaw-hook.py`)

- **Process Monitoring**: Monitors the creation of new processes on a connected Android device.
- **JavaScript Injection**: Allows users to select and inject JavaScript code into running processes.
- **Real-Time Output**: Displays real-time messages from the injected script, including any payloads sent from the target process.
- **Customizable Scripts**: Select and inject customizable JavaScript files into Android processes for dynamic instrumentation.

## Prerequisites

Before running the scripts, ensure you have the following installed:

- **Python 3.6 or higher**
- **Frida**: Install it by running `pip install frida`.
- **ADB (Android Debug Bridge)**: Ensure you have ADB installed and your Android device is connected.
- **Requests**: The `requests` library is required for downloading the latest Frida Server. If not installed, the script will attempt to install it automatically.

## Installation

To use these scripts, follow these steps:

1. Clone this repository using Git:
    ```bash
    git clone https://github.com/Pugn0/frida-manager.git
    ```
2. Navigate to the cloned directory:
    ```bash
    cd frida-manager
    ```
3. Install the required dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### **Frida Server Management Tool** (`frida-manager.py`)

To start the **Frida Server Management Tool**, run:

```bash
python frida-manager.py
```

The script will guide you through:

- Selecting an Android device.
- Downloading the appropriate version of Frida Server.
- Pushing and starting Frida Server on the selected device.
- Stopping and removing Frida Server from the device.
- Restarting Android devices.

### **Frida Process Hooking Tool** (`frida-spaw-hook.py`)

To start the **Frida Process Hooking Tool**, run:

```bash
python frida-spaw-hook.py
```

The script will guide you through:

- Selecting an Android device.
- Choosing a JavaScript file to inject into the selected device's processes.
- Monitoring and hooking new processes spawned on the device.
- Displaying real-time messages from the injected script.

### Device Selection

Both scripts list all connected Android devices, allowing you to choose which device you want to interact with by selecting its number from the prompt.

### JavaScript File Selection (for `frida-spaw-hook.py`)

In the **Frida Process Hooking Tool**, you can select a JavaScript file that will be injected into newly spawned processes on the selected Android device. The script supports multiple `.js` files located in the `/scripts` directory.

## Example Workflow

1. **Run `frida-manager.py`**: Manage the Frida Server on your Android device.
2. **Run `frida-spaw-hook.py`**: Monitor, inject, and manipulate running processes dynamically on your Android device.

## Disclaimer

These tools are intended for educational, research, and security testing purposes only. Unauthorized use on devices or software may violate terms of service, privacy laws, or other regulations. Always ensure you have explicit permission before using these tools on any device.

## Contributions

Contributions are welcome! If you have suggestions for improvements or fixes, please create a pull request.

## License

This project is distributed under the MIT license. See the `LICENSE` file for more details.

## Contact

- GitHub: [Pugn0](https://github.com/Pugn0)
- Telegram: [@pugno_yt](https://t.me/pugno_yt)
