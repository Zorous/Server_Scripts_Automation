import platform

info = {
    "OS": platform.system(),
    "Release": platform.release(),
    "Version": platform.version(),
    "Architecture": platform.architecture()[0],
    "Processor": platform.processor(),
}

for key, value in info.items():
    print(f"{key}: {value}")
