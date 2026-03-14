import sys, json, subprocess

def spawn_subagent(agent_name, prompt):
    subprocess.Popen(["gemini", "--agent", agent_name, "--prompt", prompt], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def main():
    input_data = json.load(sys.stdin)
    tool_name = input_data.get("tool_name")
    tool_input = input_data.get("tool_input", {})
    
    if tool_name == "run_shell_command":
        cmd = tool_input.get("command", "")
        if "git commit" in cmd:
            spawn_subagent("distiller", "Analyze pending ledger items and update patterns.md")
        elif "git push" in cmd:
            spawn_subagent("syncer", "Audit L2 patterns and promote global wisdom to L3 LIBRARY")
            
    print(json.dumps({"decision": "allow"}))

if __name__ == "__main__":
    main()