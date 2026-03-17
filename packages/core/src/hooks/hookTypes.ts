export interface ToolResult {
  content: Array<{ type: string; text?: string; [key: string]: any }>;
  isError?: boolean;
}

export interface AfterToolHookContext {
  toolName: string;
  args: Record<string, any>;
  result: ToolResult;
}

export type AfterToolHook = (context: AfterToolHookContext) => Promise<void>;
