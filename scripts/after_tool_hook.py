import sys, json, subprocess

def spawn_distiller():
    # Non-blocking subprocess to spawn the distiller sub-agent
    subprocess.Popen(["gemini", "--agent", "distiller", "--prompt", "Analyze pending ledger items and update patterns.md"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {})
    
    if tool_name == "run_shell_command":
        cmd = tool_input.get("command", "")
        if "git commit" in cmd:
            spawn_distiller()
            
    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()