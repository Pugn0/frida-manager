# Frida Server Management Tool

This Python script is designed to facilitate the management of Frida Server on Android devices using ADB (Android Debug Bridge). It automates tasks such as downloading the latest Frida Server, extracting it, and managing its execution across multiple connected devices.

## Features

- **Download the latest Frida Server**: Automatically fetches the most recent version based on the device architecture.
- **Extract and prepare Frida Server**: Extracts the downloaded Frida Server for use on Android devices.
- **Install Frida Tools**: Installs the necessary Frida tools via pip.
- **Device management**: Lists connected Android devices and allows users to select them for operation.
- **Push and start Frida Server**: Transfers and starts Frida Server on selected devices.
- **Start and stop Frida Server**: Initiates or terminates the Frida Server on the chosen devices.
- **Remove Frida Server**: Deletes the Frida Server from the specified devices.
- **Restart devices**: Restarts selected Android devices.

## Prerequisites

Before running this script, ensure you have Python installed on your system (Python 3.6 or higher is recommended). Additionally, you need the `requests` library and ADB installed. The script will attempt to install `requests` if it's not already available.

## Installation

To use this script, follow these steps:

1. Clone this repository using Git:
    ```bash
    git clone https://github.com/Pugn0/frida-manager.git
    ```
2. Navigate to the cloned directory:
    ```bash
    cd frida-manager
    ```
3. (Optional) If `requests` is not installed, the script will automatically attempt to install it the first time you run it.

## How to Use

After installation, run the script directly from the terminal. It will guide you through the necessary inputs to manage Frida Server on your devices.

To start the script, run:
```bash
python frida-manager.py
```

You will be prompted to select devices, download the Frida Server, and execute various management tasks. Follow the on-screen instructions to perform actions such as starting or stopping the server.

## Disclaimer

This script is intended for educational and demonstration purposes only. Users should ensure that their use of the script complies with applicable terms of service and laws regarding software usage and device management.

## Contributions

Contributions to this project are welcome. If you have suggestions for improvements or fixes, please create a pull request.

## License

This project is distributed under the MIT license. See the `LICENSE` file for more details.

## Contact

- GitHub: [Pugn0](https://github.com/Pugn0)
- Telegram: [pugno_fc](https://t.me/pugno_fc)
