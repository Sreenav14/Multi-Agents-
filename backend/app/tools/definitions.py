"""
tool definition system 

each tool has:
1. A JSON schema that tells the LLM what parameters it accepts
2. A handler function that executes the tool with those parameters

The LLM receives schemas, decides which tool to call with what arguments and we execute that only
"""

from typing import Any, Dict, List, Optional, Callable

ToolHandler = Callable[[Dict[str, Any]], str]


class ToolDefinition:
    """
    A complete tool definition with schema + execution handler.
    
    Attributes:
    name: unique identifier for the tool
    description: Human-readable description for llm to understand and use
    parameters: JSON schema for the tool's input parameters
    handler: function that executes the tool with the given parameters
    require_config: List of config keys needed(like api key)
    """
    def __init__(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any],
        handler: ToolHandler,
        require_config: Optional[List[str]] = None
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.handler = handler
        self.require_config = require_config or []
        
class ToolRegistry:
    """
    Central registry for all the available tools
    
    Usage:
     registry = ToolRegistry()
     registry.register(my_tool_defination)
     
    #  Get Schemas for LLM
    schemas = registry.get_openai_schemas(["tool1", "tool2"])
    
    #  Execute a tool
    result = registry.execute("tool1),{"param" : "value"}, config={"api_key" : "..."}
    
    """
    def __init__(self):
        self._tools: Dict[str, ToolDefinition] = {}
        
    def register(self, tool: ToolDefinition) -> None:
        """ Register a tool defination"""
        if tool.name in self._tools:
            raise ValueError(f"Tool '{tool.name}' already registered")
        self._tools[tool.name] = tool
        
    def get(self,name:str)-> Optional[ToolDefinition]:
        """ Get a tool definition by name"""
        return self._tools.get(name)
    
    def list_tools(self)-> List[str]:
        """List all registered tool names"""
        return list(self._tools.keys())
    
    def get_openai_schemas(self, name:str)-> Optional[Dict[str, Any]]:
        """
        Get a single tool's schema in openai/groq function calling format.
        
        returns:
        {
            "type" : "function",
            "function" : {
                "name" : "tool_name",
                "description" : "..",
                "parameters" : { JSON Schema}
            }
        }
        
        """
        tool = self._tools.get(name)
        if not tool:
            return None
        
        return {
            "type" : "function",
            "function" : {
                "name" : tool.name,
                "description" : tool.description,
                "parameters" : tool.parameters,
            }
        }
        
        
    def get_openai_schemas_list(self, tool_names:List[str])-> List[Dict[str, Any]]:
        """ Get multiple tool schemas for passing to LLM"""
        schemas = []
        for name in tool_names:
            schema = self.get_openai_schemas(name)
            if schema:
                schemas.append(schema)
        return schemas 
            
    def execute(
        self,
        name:str,
        arguments: Dict[str, Any],
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """ 
        Execute a tool by name with given arguments.
        
        Args:
            name: tool name
            arguments: Parameters fro  LLM's function call
            config: Additional config (api_keys, etc) -> injected, not from llm
            
        returns:
            String result from tool execution
        """
        
        tool = self._tools.get(name)
        if not tool:
            return f"Tool '{name}' not found"
        
        # Merge config into arguments if needed
        # Config values are injected server-side, not from LLM
        
        merged_args = {**arguments}
        if config: 
            for key in tool.require_config:
                if key in config and key not in merged_args:
                    merged_args[f"_config_{key}"] = config[key]
                    
        try:
            # Check if handler accepts config parameter
            import inspect
            sig = inspect.signature(tool.handler)
            if len(sig.parameters) >= 2:
                # Handler expects (args, config)
                result = tool.handler(merged_args, config or {})
            else:
                # Handler expects only (args)
                result = tool.handler(merged_args)
            # Ensure result is always a string
            return str(result) if result is not None else ""
        except Exception as e:
            return f"Error executing {name}: {str(e)}"
        
        
# Global registry instance

TOOL_REGISTRY = ToolRegistry()

def register_tool(tool: ToolDefinition) -> None:
    """ Register a tool defination with the global registry"""
    
    TOOL_REGISTRY.register(tool)
    return tool
