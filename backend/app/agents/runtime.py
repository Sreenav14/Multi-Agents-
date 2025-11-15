from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.db.models import Assistant, Run, Message


def _build_prompt_for_agent(
    agent_node: Dict[str, Any],
    messages: List[Message]
)-> str:
    """
    Build  a simple text prompt for the current agent, using:
    - agent's system_promptfrom graph_json
    - the conversation history so far (user + pervious agents)
    
    for now this is a very simple concatenation. Later, you can can
    make it more structured or switch to chat-style prompts.
    """
    system_prompt = agent_node.get("System_prompt","")
    role = agent_node.get("role",agent_node.get("id","agent"))
    
    history_texts= []
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

def _dummy_llm_call(prompt:str,agent_id:str)->str:
    """
    Temporary placeholder for an LLM call.
    
    for now, it just return a simple string so you can
    verify the full runtime flow.
    Later, you will replace this with a real GROQ
    call using your settings.Groq_API_KEY.
    """
    # You can print the prompt for debugging if you want
    # print("LLM PROMPT:\n", prompt)
    return f"[{agent_id}](dummy) response based on the prompt"
        
def run_assistant_graph(
    db:Session,
    assistant:Assistant,
    run:Run,
)->List[Message]:
    """
    Core multi-agent orchestration function.
    
    -Takes an Assistant (with graph_json),
    and a Run (with input_text).
    - creates a user message as the first message.
    - then, for each node in graph_json["nodes] in order:
     *builds a prompt
     *calls the LLM
     *inserts a message row for that agent 
     
    Returns the list of messages instance in this run.
    
    """
    all_messages:List[Message] = []
    
    user_message = Message(
        run_id = run.id,
        sender = "user",
        content = run.input_text,
        message_metadata = None,
    )
    db.add(user_message)
    db.flush()
    all_messages.append(user_message)
    
    graph = assistant.graph_json or {}
    nodes = graph.get("nodes", [])
    
    for node in nodes:
        agent_id = node.get("id","agent")
        prompt = _build_prompt_for_agent(node, all_messages)
        
        # TODO : Replace _dummy_llm_call with a real llm call
        agent_response = _dummy_llm_call(prompt, agent_id)
        
        agent_message = Message(
            run_id = run.id,
            sender = agent_id,
            content = agent_response,
            message_metadata = None,
        )
        db.add(agent_message)
        db.flush()
        all_messages.append(agent_message)
        
        # NOTE : we do not commit here; the router will handle commit/rollback
        # after updating run.status etc
        
        return all_messages