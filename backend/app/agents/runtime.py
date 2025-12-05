"""
Agent runtime system that:

handles the execution of agent graph with agentic tool loops
the LLM decides when to call tools, we execute them and feed result back
    
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import json, time

from app.db.models import Assistant, Run, Message
from app.llm.client import LLMResponse, call_llm_with_tools, build_tool_result_message, build_assistant_tool_call_message
from app.tools.definitions import TOOL_REGISTRY
# Import registry to trigger tool registrations
import app.tools.registry  # noqa: F401


MAX_TOOL_ITERATIONS = 10

AGENT_DELAY_SECONDS = 0  # Removed delay for faster execution

def _build_chat_messages(
    system_prompt: str,
    history: List[Message],
    agent_outputs_as_context: bool = True,
    has_tools: bool = False,  # Add this parameter
)-> List[Dict[str, Any]]:
    """
    Build chat messages for the LLM.
    
    Args:
        system_prompt: The agent's system Instructions
        history: List of message objects from pervious chat
        agent_output_as_context: Whether to include agent output as context
        has_tools: Whether this agent has access to tools
    """
    messages = []
    
    # Separate user query and agent outputs
    user_query = ""
    agent_outputs = []
    
    for m in history:
        if m.sender == "user":
            user_query = m.content
        else:
            agent_outputs.append(f"[{m.sender}]: \n{m.content}")
            
    # Build system prompt with context from other agents
    full_system = system_prompt
    
    # Add generic tool usage instruction if tools are available
    if has_tools:
        tool_instruction = (
            "\n\nYou have access to tools that provide REAL data and actions. "
            "When a user asks for information that a tool can provide, USE THE TOOL - do not provide code, scripts, or hypothetical data. "
            "The tools connect to real accounts and services the user has authorized."
        )
        full_system = f"{full_system}{tool_instruction}"
    
    if agent_outputs_as_context and agent_outputs:
        context = "\n\n".join ([
            " * Previous Agent output * ",
            *agent_outputs,
            " * End of Previous Agent output * ",
        ])
        full_system = f"{full_system}\n\n{context}"
        
    # Add system message
        
    if full_system:
        messages.append({"role":"system", "content":full_system}) 
        
    # Add user query
    
    if user_query:
        messages.append({"role": "user", "content": user_query})
        
    return messages


def run_agent_with_tools(
    system_prompt: str,
    history: List[Message],
    tool_names: List[str],
    tool_configs: Dict[str, Dict[str, Any]],
    agent_id: str="agent",   
)-> Tuple[str, List[str]]:  # Return (output, tools_used)
    """
    Run a single agent with LLM-Driven tool calling loop
    
    this is th core of the architecture:
    1. send tools schema to LLM
    2. LLM decides to call tools or not
    3. feed results back to llm
    4. repeat until llm return a final text response
    
    Args:
        system_prompt: System prompt for the agent
        history: List of message objects from pervious chat
        tool_names: List of tool names to use
        tool_config: Configuration for each tool
        agent_id: Unique identifier for the agent
        
    Returns:
        Final text response from the agent
    
    """
    
    # get tool schemas for only the tools this agent is allowed to call
    tool_schemas = TOOL_REGISTRY.get_openai_schemas_list(tool_names)
    print(f"[DEBUG] Agent {agent_id} has access to {len(tool_schemas)} tools: {tool_names}")
    print(f"[DEBUG] Available tools in registry: {list(TOOL_REGISTRY._tools.keys())}")
    if len(tool_schemas) == 0 and len(tool_names) > 0:
        print(f"[WARNING] Tool names requested but no schemas found! Check if tools are registered.")
    
    # Build initial messages - pass has_tools parameter
    messages = _build_chat_messages(
        system_prompt, 
        history,
        agent_outputs_as_context=True,
        has_tools=len(tool_schemas) > 0  # Automatically detect if tools are available
    )
    
    # tool calling loop
    tool_call_history = []  # Track tool calls to detect loops
    
    for iteration in range(MAX_TOOL_ITERATIONS):
        print(f"[DEBUG] Agent {agent_id} - Tool loop iteration {iteration + 1}")
        
        # If we're close to max iterations, force a final response
        if iteration >= MAX_TOOL_ITERATIONS - 2:
            print(f"[DEBUG] Approaching max iterations, requesting final response from LLM")
            messages.append({
                "role": "user",
                "content": "You have gathered sufficient information. Please provide your final response now based on all the tool results above. Do not call any more tools."
            })
            # Remove tools from this call to force text response
            response: LLMResponse = call_llm_with_tools(
                messages=messages,
                tools=None,  # Force text-only response
            )
            if response.has_content:
                content_length = len(response.content) if response.content else 0
                print(f"[DEBUG] Agent {agent_id} returned final response ({content_length} chars)")
                # Extract unique tool names from history
                tools_used = []
                for call_list in tool_call_history:
                    for call_sig in call_list:
                        tool_name = call_sig.split(":")[0]
                        if tool_name not in tools_used:
                            tools_used.append(tool_name)
                return response.content, tools_used
        
        # call LLM with tools
        response: LLMResponse = call_llm_with_tools(
            messages = messages,
            tools = tool_schemas if tool_schemas else None,
        )
        # if LLM returned content (no tool calls), we're done
        if response.has_content and not response.has_tool_calls:
            content_length = len(response.content) if response.content else 0
            print(f"[DEBUG] Agent {agent_id} returned final response ({content_length} chars)")
            # Extract unique tool names from history
            tools_used = []
            for call_list in tool_call_history:
                for call_sig in call_list:
                    tool_name = call_sig.split(":")[0]  # Extract tool name from signature
                    if tool_name not in tools_used:
                        tools_used.append(tool_name)
            return response.content, tools_used
        
        # if LLM wants to call tools
        if response.has_tool_calls:
            tool_call_count = len(response.tool_calls or [])
            print(f"[DEBUG] Agent {agent_id} requested {tool_call_count} tool call(s)")
            
            # Detect duplicate tool calls (infinite loop detection)
            current_calls = []
            for tc in response.tool_calls:
                call_signature = f"{tc['name']}:{json.dumps(tc.get('arguments', {}), sort_keys=True)}"
                current_calls.append(call_signature)
            
            # Check if we've seen these exact calls before
            if current_calls in tool_call_history:
                print(f"[WARNING] Detected duplicate tool calls, forcing final response")
                messages.append({
                    "role": "user",
                    "content": "You have already searched for this information. Based on the tool results you have received, please provide your final response now. Do not call any more tools."
                })
                # Force text-only response
                final_response: LLMResponse = call_llm_with_tools(
                    messages=messages,
                    tools=None,
                )
                if final_response.has_content:
                    # Extract unique tool names from history
                    tools_used = []
                    for call_list in tool_call_history:
                        for call_sig in call_list:
                            tool_name = call_sig.split(":")[0]
                            if tool_name not in tools_used:
                                tools_used.append(tool_name)
                    return final_response.content, tools_used
                # If still no content, break
                break
            
            tool_call_history.append(current_calls)
            
            # add assistant message with tool calls to conversation 
            messages.append(build_assistant_tool_call_message(response.tool_calls))
            
            # Execute each tool and add results
            for tc in response.tool_calls:
                tool_name = tc["name"]
                tool_args = tc["arguments"]
                tool_id = tc["id"]
                
                # Get config for this tool (api keys, set)
                config = tool_configs.get(tool_name, {})
                
                print(f"[DEBUG] Executing tool:{tool_name}({json.dumps(tool_args)[:100]}...)")
                
                # Execute the tool
                result = TOOL_REGISTRY.execute(tool_name, tool_args, config=config)
                
                print(f"[DEBUG] Tool {tool_name} result: {result[:200] if result else 'EMPTY'}...")
                
                # Addd tool results to conversation
                messages.append(build_tool_result_message(tool_id, result))
            
            # After adding tool results, inject a reminder to provide final response
            # This helps the LLM understand it should synthesize the results
            if iteration >= 2:  # After 2+ tool calls, remind to provide response
                messages.append({
                    "role": "user",
                    "content": "You have gathered information from the tools. Please synthesize the results and provide your final response. Include key findings, specific details, and organize the information clearly."
                })
            
            # Removed delay for faster execution
            
            # continue the loop - LLM will see tool results
            continue
        
        # Edge case: no content and no tool calls
        print(f"[WARNING] Agent {agent_id} returned neither content nor tool calls")
        break
    
    # If we hit max iterations, try one last time without tools
    print(f"[WARNING] Agent {agent_id} reached max tool iterations ({MAX_TOOL_ITERATIONS}), attempting final response")
    messages.append({
        "role": "user",
        "content": "You have reached the maximum number of tool calls. Based on all the information you have gathered from the tools above, please provide your final comprehensive response now. Summarize the key findings and present them clearly."
    })
    
    # Final attempt without tools
    final_response: LLMResponse = call_llm_with_tools(
        messages=messages,
        tools=None,  # No tools, force text response
    )
    
    if final_response.has_content and final_response.content:
        content_length = len(final_response.content) if final_response.content else 0
        print(f"[DEBUG] Agent {agent_id} returned final response after max iterations ({content_length} chars)")
        return final_response.content
    
    # Last resort: return error with context
    return f"[Agent] {agent_id} reached maximum tool iterations ({MAX_TOOL_ITERATIONS}) without completing. Made {len(tool_call_history)} tool call attempts."


def run_assistant_graph(
    db:Session,
    assistant: Assistant,
    run: Run,
    previous_messages: List[Message] = None,
    tools_by_agent: Dict[str, List[Dict[str, Any]]] = None,
)-> List[Message]:
    """ 
    Execute the full assistant graph with LLM-driven tool calling.
    
    This processes each agent node in sequence , where each agent can:
    use tools via the agentic tool loop
    see outputs from previous agents
    produce a response that subsequent agents can see
    
    Args:
        db:Database session
        assistant: The Assistant model with graph_json
        run: The current Run being executed
        previous_messages: Messages from previous runs in this chat (for context)
        tools_by_agent: Tool configurations per agent
            format: {
                "agent_id":[
                    {"kind": "user_tool", "template_key":"tavily_search", "config":{....}},
                    ....
                ]
            }
    Returns:
        List of messages created during the run
    """
    
    if previous_messages is None:
        previous_messages = []
    if tools_by_agent is None:
        tools_by_agent = {}
    
    print(f"[DEBUG] run_assistant_graph called with tools_by_agent: {tools_by_agent}")
        
    graph = assistant.graph_json or {}
    nodes = graph.get("nodes", [])
    messages_for_this_run: List[Message] = previous_messages.copy()
    
    # 1. create initial user message
    
    user_message = Message(
        run_id = run.id,
        sender = "user",
        content = run.input_text,
         message_metadata = None,
         created_at = datetime.utcnow(),
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)
    messages_for_this_run.append(user_message)
    
    # 2 Get agent node
    
    agent_nodes = [n for n in nodes if n.get("type") == "agent"]
    print(f"[DEBUG] Found {len(agent_nodes)} agent nodes to process")
    
    # 3 Process each agent
    for idx, node in enumerate(agent_nodes):
        # Removed delay between agents for faster execution
        
        agent_id = node.get("id", "agent")
        system_prompt = node.get("system_prompt", "")
        role_name = node.get("role", agent_id)
        
        print(f"[DEBUG] Processing agent {idx+1}/{len(agent_nodes)}: {agent_id} ({role_name})")
        
        # Get tools for this agent
        agent_tool_configs = tools_by_agent.get(agent_id, [])
        
        # Extract tool names and configs
        tool_names = []
        tool_configs = {}
        
        for tool_info in agent_tool_configs:
            if tool_info.get("kind") == "user_tool":
                template_key = tool_info.get("template_key")
                tool_status = tool_info.get("status", "pending")
                
                # Skip tools that aren't connected
                if tool_status != "connected":
                    print(f"[WARNING] Skipping tool '{template_key}' - status is '{tool_status}', not 'connected'")
                    continue
                
                if template_key:
                    tool_names.append(template_key)
                    # Config is retrieved from database via tool_resolver
                    raw_config = tool_info.get("config", {})
                    # Check if config has nested structure matching template_key
                    if isinstance(raw_config, dict):
                        if template_key in raw_config:
                            # Nested: {"tavily": {"api_key": "..."}}
                            tool_configs[template_key] = raw_config[template_key]
                        elif "api_key" in raw_config or "gmail_credentials" in raw_config or any(k.startswith("_") for k in raw_config.keys()):
                            # Flat config - use as is
                            tool_configs[template_key] = raw_config
                        else:
                            # Empty or unknown structure - use as is
                            tool_configs[template_key] = raw_config
                    else:
                        # Not a dict - use empty config
                        tool_configs[template_key] = {}
        
        print(f"[DEBUG] Agent {agent_id} tools: {tool_names}")
        print(f"[DEBUG] Agent {agent_id} tool_configs keys: {list(tool_configs.keys())}")
        for tk, tc in tool_configs.items():
            print(f"[DEBUG]   Tool '{tk}' config keys: {list(tc.keys()) if isinstance(tc, dict) else 'NOT A DICT'}")
        
        # Run agent with tool loop
        tools_used = []
        try:
            llm_output, tools_used = run_agent_with_tools(
                system_prompt=system_prompt,
                history=messages_for_this_run,
                tool_names=tool_names,
                tool_configs=tool_configs,
                agent_id=agent_id,
            )
            
            # Handle empty output
            if not llm_output or not llm_output.strip():
                print(f"[WARNING] Agent {agent_id} returned empty output")
                
                # Retry once
                llm_output, retry_tools = run_agent_with_tools(
                    system_prompt=system_prompt,
                    history=messages_for_this_run,
                    tool_names=tool_names,
                    tool_configs=tool_configs,
                    agent_id=agent_id,
                )
                # Merge tools used from retry
                tools_used.extend([t for t in retry_tools if t not in tools_used])
                
                # If still empty, use a default message
                if not llm_output or not llm_output.strip():
                    llm_output = f"[Agent] {agent_id} could not produce a response after multiple attempts"
                
        except Exception as e:
            print(f"[ERROR] Exception in agent {agent_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            llm_output = f"[Error in {role_name}: {str(e)}]"
            tools_used = []  # No tools used if error occurred
        
        # Save agent message with tool metadata
        message_metadata = None
        if tools_used:
            message_metadata = {"tools_used": tools_used}
        
        agent_message = Message(
            run_id=run.id,
            sender=agent_id,
            content=llm_output,
            message_metadata=message_metadata,
            created_at=datetime.utcnow(),
        )
        db.add(agent_message)
        db.commit()
        db.refresh(agent_message)
        messages_for_this_run.append(agent_message)
    
# 4. Mark run completed
    run.status = "completed"
    run.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(run)
    
    return messages_for_this_run



# LEGACY SUPPORT (for backwards compatibility during migration)

def _build_prompt_for_agent(
    agent_node: Dict[str, Any],
    messages: List[Message]
)->str:
    """ 
    DEPREACATED: kept for backwards compatibiltiy.
    Use run_agent_with_tools() instead.
    """
    
    system_prompt = agent_node.get("system_prompt", "")
    role = agent_node.get("role", agent_node.get("id", "agent"))

    history_texts = []
    for m in messages:
        history_texts.append(f"{m.sender}: {m.content}")

    history_block = "\n".join(history_texts)

    prompt = (
        f"{system_prompt}\n\n"
        f"Agent role: {role}\n\n"
        f"Conversation so far: \n{history_block}\n\n"
        f"Now respond as {role}."
    )

    return prompt