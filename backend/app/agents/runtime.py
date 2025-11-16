from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
from app.db.models import Assistant, Run, Message
from app.llm.client import call_llm


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
    system_prompt = agent_node.get("system_prompt", "")
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


def _real_llm_call(
    system_prompt: str,
    history: List[Message],
    new_user_content: str | None = None,
) -> str:
    """
    Build a simple chat history and call Groq.

    - system_prompt: the agent's system instructions
    - history: list of Message objects (user + agents so far in this run)
    - new_user_content: if not None, append as the latest user message
    """
    messages = []

    # System prompt
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})

    # History: convert DB messages into chat format
    for m in history:
        role = "user" if m.sender == "user" else "assistant"
        # For agent messages, prefix with their role for clarity
        content = m.content
        if m.sender != "user":
            content = f"[{m.sender}]: {content}"
        messages.append(
            {
                "role": role,
                "content": content,
            }
        )

    # Optional new user content (for first agent, etc.)
    if new_user_content:
        messages.append({"role": "user", "content": new_user_content})

    # Add explicit instruction for researcher to ensure it responds
    if "researcher" in system_prompt.lower() or "research agent" in system_prompt.lower():
        messages.append({
            "role": "user",
            "content": "Now provide your research findings based on the plan above. Include detailed information, facts, trends, and examples. Make sure to provide substantial content."
        })
    
    # Add explicit instruction for writer to ensure it responds
    if "writer" in system_prompt.lower() or "writing agent" in system_prompt.lower():
        messages.append({
            "role": "user",
            "content": "Now write your final, comprehensive answer based on the plan and research above. Make sure to provide a complete response."
        })

    return call_llm(messages)
        
def run_assistant_graph(
    db: Session,
    assistant: Assistant,
    run: Run,
) -> list[Message]:
    """
    Execute the assistant's agent graph (Planner -> Researcher -> Writer)
    and store all messages in the DB.

    Returns the list of Message objects for this run.
    """

    graph = assistant.graph_json or {}
    nodes = graph.get("nodes", [])

    # 1) Create initial user message from run.input_text
    user_message = Message(
        run_id=run.id,
        sender="user",
        content=run.input_text,
        message_metadata=None,
        created_at=datetime.utcnow(),
    )
    db.add(user_message)
    db.commit()
    db.refresh(user_message)

    messages_for_this_run: list[Message] = [user_message]

    # 2) Iterate through nodes in order (Planner -> Researcher -> Writer)
    agent_nodes = [n for n in nodes if n.get("type") == "agent"]
    
    print(f"[DEBUG] Found {len(agent_nodes)} agent nodes to process")
    
    for idx, node in enumerate(agent_nodes):
        agent_id = node.get("id", "agent")
        system_prompt = node.get("system_prompt", "")
        role_name = node.get("role", agent_id)

        print(f"[DEBUG] Processing agent {idx+1}/{len(agent_nodes)}: {agent_id} ({role_name})")

        # History is all messages so far in this run
        history = messages_for_this_run

        # For simplicity, we don't add extra new_user_content here,
        # we just let the agent see the full history.
        try:
            print(f"[DEBUG] Calling LLM for {agent_id} with {len(history)} messages in history")
            llm_output = _real_llm_call(
                system_prompt=system_prompt,
                history=history,
                new_user_content=None,
            )
            
            print(f"[DEBUG] {agent_id} returned {len(llm_output) if llm_output else 0} characters")
            
            # Ensure we got output - retry with more explicit prompt if empty
            if not llm_output or not llm_output.strip():
                print(f"[WARNING] {agent_id} produced empty output! Retrying with explicit prompt...")
                try:
                    # Retry with a more direct instruction
                    retry_output = _real_llm_call(
                        system_prompt=system_prompt,
                        history=history,
                        new_user_content=f"IMPORTANT: You must provide a detailed {role_name.lower()} response. Do not leave it empty. Provide at least 3-5 sentences with specific information, facts, or analysis.",
                    )
                    if retry_output and retry_output.strip():
                        llm_output = retry_output
                        print(f"[SUCCESS] {agent_id} produced output after retry: {len(llm_output)} characters")
                    else:
                        llm_output = f"[{role_name} completed but produced no output after retry]"
                except Exception as retry_e:
                    print(f"[ERROR] Retry failed for {agent_id}: {str(retry_e)}")
                    llm_output = f"[{role_name} completed but produced no output]"
        except Exception as e:
            print(f"[ERROR] Exception in {agent_id}: {str(e)}")
            import traceback
            traceback.print_exc()
            llm_output = f"[Error in {role_name}: {str(e)}]"

        agent_message = Message(
            run_id=run.id,
            sender=agent_id,
            content=llm_output,
            message_metadata=None,
            created_at=datetime.utcnow(),
        )
        db.add(agent_message)
        db.commit()
        db.refresh(agent_message)

        messages_for_this_run.append(agent_message)

    # 3) Mark run completed
    run.status = "completed"
    run.completed_at = datetime.utcnow()
    db.add(run)
    db.commit()
    db.refresh(run)

    return messages_for_this_run