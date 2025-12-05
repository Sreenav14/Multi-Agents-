"""
Tool Registry 

this file defines all abailable tools with
1. json schema - tells LLM what parameters each tool accepts
2. Handler - executes the tool with LLM provided arguments

    """
    
from typing import Dict, Any, List
import requests
from email.mime.text import MIMEText
import base64
from collections import defaultdict

from app.tools.gmail_helpers import gmail_list_recent, gmail_search, gmail_create_draft, gmail_top_emails
from app.tools.definitions import ToolDefinition, TOOL_REGISTRY, register_tool
from app.services.google_oauth import build_gmail_client_from_tokens, refresh_gmail_tokens
<<<<<<< HEAD
from app.mcp.client import call_mcp_tool, MCPClientError
=======
>>>>>>> origin/main

# TAVILY WEB SEARCH

def _tavily_handler(args: Dict[str,Any])-> str:
    """
    Execute Tavily web search for CURRENT and REAL-TIME information

    Args:
        LLM - query: The search query string
        
        config - API KEY

    """
    from datetime import datetime
    
    # Get LLM provided arguments
    query = args.get("query","")
    if not query:
        return "Error: No search query provided"
    
    # Get injected config (API key)
    api_key = args.get("_config_api_key")
    if not api_key:
        return f"Error: Tavily API key not configured. Cannot perform web search for '{query}'."
    
    # Optional parameters with defaults
    search_depth = args.get("search_depth", "advanced")  # Use advanced by default for better current results
    
    # Enhance query for time-sensitive searches
    # If query mentions dates, events, news, current, today, etc., add current date
    current_date = datetime.now().strftime("%B %d, %Y")
    current_year = datetime.now().strftime("%Y")
    
    # Check if query is time-sensitive (mentions dates, events, news, current, today, upcoming, etc.)
    time_sensitive_keywords = [
        "event", "events", "today", "current", "upcoming", "now", "recent", 
        "latest", "news", "happening", "schedule", "calendar", "date"
    ]
    query_lower = query.lower()
    is_time_sensitive = any(keyword in query_lower for keyword in time_sensitive_keywords)
    
    # Enhance query with current date context if time-sensitive
    if is_time_sensitive:
        # Add current date to query to get most recent results
        enhanced_query = f"{query} {current_date} {current_year} current events"
    else:
        enhanced_query = query
    
    url = "https://api.tavily.com/search"
    payload={
        "api_key": api_key,
        "query": enhanced_query,
        "search_depth" : search_depth,
        "max_results" : 5,  # Fixed default, not exposed to LLM
        "include_answer" : True,
    }
    try:
        resp = requests.post(url, json=payload, timeout=20)
    except Exception as e:
        return f"Error: Tavily request failed: {str(e)}"
    
    if resp.status_code != 200:
        return f'Error: Tavily returned HTTP {resp.status_code}'
    
    data = resp.json()
    
    # Return the synthesized answer
    answer = data.get("answer")
    if answer:
        # Check if answer contains old dates (previous years)
        current_year = datetime.now().year
        # If answer mentions years that are not current, add a note
        if str(current_year - 1) in answer or str(current_year - 2) in answer:
            # Don't modify answer, but the LLM should be aware
            pass
        return answer
    
    # fallback : return top results if no answer
    results = data.get("results", [])
    if results:
        summaries = []
        current_year = datetime.now().year
        for r in results[:3]:
            title = r.get("title", "")
            content = r.get("content", " ")[:200]
            # Check if result seems outdated
            url = r.get("url", "")
            # Add result
            summaries.append(f"{title}: {content}")
        
        result_text = "\n".join(summaries)
        
        # Add a note if results might be outdated
        if is_time_sensitive:
            result_text += f"\n\n[Note: Please verify these results are current for {current_date}. If results mention dates from previous years, they may be outdated.]"
        
        return result_text
    return "No search results found"

# Register Tavily tool
register_tool(ToolDefinition(
    name="tavily",
    description = "Search the web for CURRENT and REAL-TIME information. Use this for questions about current events, news, today's events, upcoming events, recent developments, or any information that changes over time. IMPORTANT: Always include the current date (today's date) in your search query when searching for events, schedules, or time-sensitive information. The current date helps ensure you get the most recent and accurate results.",
    parameters = {
        "properties":{
            "query":{
                "type":"string",
                "description": "The search query. For time-sensitive queries (events, news, schedules), ALWAYS include the current date (today's date) in your query. Example: 'events in New York City on November 27, 2025' or 'current news about AI in November 2025'. Be specific and include relevant keywords and dates."
            },
            "search_depth" : {
                "type":"string",
                "enum": ["basic","advanced"],
                "description": "Search depth. Use 'advanced' for complex research queries or when you need the most current information. Defaults to 'advanced' for better real-time results."
            }
        },
        "required": ["query"]
    },
    handler= _tavily_handler,
    require_config = ["api_key"]
))

# WEATHER (OpenWeatherMap)
def _weather_handler(args: Dict[str, Any])-> str:
    """
    Get current weather for a location
    
    Args from LLM:
        -location: City name (required)
        -units: 'metrics' or imperial (optional)
    
    Args injected from config:
        -_config_api_key: OpenWeatherMap API key
    """
    
    # Get LLM-provided arguments
    
    location = args.get("location", "")
    if not location:
        return "Error: No location provided"
    units = args.get("units", "metric")
    
    # Get injected config (API key)
    api_key = args.get("_config_api_key")
    if not api_key:
        return f"Error: OpenWeatherMap API key not configured. Cannot get weather for '{location}'."
    
    print(f"[DEBUG] Weather API call for {location} ")
    
    url = "https://api.openweathermap.org/data/2.5/weather"
    payload = {
        "q": location,
        "appid":api_key,
        "units":units,
    }
    
    try:
        resp = requests.get(url, params=payload, timeout=10)
    except Exception as e:
        return f"Error: Weather API request failed: {str(e)}"
    
    if resp.status_code ==404:
        return f"Error: city '{location}' not found"
    
    if resp.status_code !=200:
        return f"Error: Weather API returned HTTP {resp.status_code}"
    
    data = resp.json()
    
    # Extract weather data
    
    city_name = data.get("name", location)
    country = data.get("sys",{}).get("country", "")
    main = data.get("main",{})
    weather_list = data.get("weather",[])
    wind = data.get("wind",{})
    
    temp = main.get("temp")
    feels_like = main.get("feels_like")
    humidity = main.get("humidity")
    description = weather_list[0].get("description","N/A") if weather_list else "N/A"
    wind_speed = wind.get("speed")
    
    # Build response
    unit_symbol = "°C" if units == "metric" else "°F"
    speed_unit = "m/s" if units == "metrics" else "mph"
    
    parts = [f"Weather in {city_name}, {country}"]
    
    if temp is not None:
        parts.append(f"Temperature: {temp:.1f}{unit_symbol}")
    if feels_like is not None:
        parts.append(f"Feels like: {feels_like:.1f}{unit_symbol}")
    parts.append(f"Conditions: {description.capitalize()}")
    if humidity is not None:
        parts.append(f"Humidity: {humidity}%")
    if wind_speed is not None:
        parts.append(f"Wind: {wind_speed} {speed_unit}")
    
    return "|".join(parts)

# Register Weather tool with JSON schema
register_tool(ToolDefinition(
    name="weather",
    description="Get current weather conditions for a city. Returns temperature, conditions, humidity, and wind speed.",
    parameters={
        "type": "object",
        "properties": {
            "location": {
                "type": "string",
                "description": "City name, e.g. 'London', 'New York', 'Tokyo'. Can include country code like 'Paris,FR'"
            },
            "units": {
                "type": "string",
                "enum": ["metric", "imperial"],
                "description": "Temperature units. 'metric' for Celsius, 'imperial' for Fahrenheit. Defaults to metric."
            }
        },
        "required": ["location"]
    },
    handler=_weather_handler,
    require_config=["api_key"],  # Will be injected as _config_api_key
))


# GMAIL HANDLER + REGISTRATION

def gmail_tool_handler(args: Dict[str, Any], config: Dict[str, Any]) -> str:
    """ 
    Handle Gmail actions: list_recent, search, draft, top_emails
    
    `config` is expected to contain:
        config["gmail_credentials"] -> token dict from OAuth.
    Automatically refreshes expired tokens.
    """
    print(f"[DEBUG] Gmail handler called with config keys: {list((config or {}).keys())}")
    
    gmail_creds = (config or {}).get("gmail_credentials")
    if not gmail_creds:
        return "Error: Gmail is not connected. Please go to Add Tools, click 'Connect' on Gmail Toolkit, and complete the Google login to authorize access to your emails."
    
    # Get OAuth credentials from config for token refresh
    oauth_client_id = config.get("oauth_client_id")
    oauth_client_secret = config.get("oauth_client_secret")
    
    # Refresh token if expired before building client
    try:
        gmail_creds = refresh_gmail_tokens(
            gmail_creds,
            oauth_client_id=oauth_client_id,
            oauth_client_secret=oauth_client_secret
        )
    except Exception as e:
        raise ValueError(f"Failed to refresh Gmail credentials: {str(e)}. Please re-authorize Gmail access.")
    
    gmail = build_gmail_client_from_tokens(
        gmail_creds,
        oauth_client_id=oauth_client_id,
        oauth_client_secret=oauth_client_secret
    )
    
    action = args.get("action", "list_recent")
    max_results = int(args.get("max_results",10))
    
    if action == "list_recent":
        return gmail_list_recent(gmail, max_results=max_results)
    
    if action == "search":
        query = args.get("query") or ""
        return gmail_search(gmail, query=query, max_results=max_results)
    
    if action == "top_emails":  # Add this new action
        return gmail_top_emails(gmail, max_results=max_results)
        
    if action == "draft":
        to = args.get("to")
        subject = args.get("subject")
        body = args.get("body")
        if not to or not subject or not body:
            raise ValueError("For action='draft', 'to', 'subject', and 'body' are required")
        
        return gmail_create_draft(gmail, to=to, subject=subject, body=body)
    
    return f"Error: Unknown action '{action}'. Available actions: list_recent, search, top_emails, draft"

#  Register Gmail tool

gmail_tool = ToolDefinition(
    name = "gmail",
    description=(
        "Access user's Gmail account to read emails and create drafts. "
        "Actions: list_recent (inbox emails), search (find emails by query), top_emails (frequent senders), draft (create email draft)."
    ),
    parameters = {
        "type": "object",
         "properties" : {
             "action" : {
                 "type": "string",
                 "enum": ["list_recent", "search", "draft", "top_emails"],  
                 "description": (
                     "Action to perform: "
                     "'list_recent' - get most recent emails from inbox, "
                     "'search' - search emails using Gmail query syntax (requires 'query' parameter), "
                     "'top_emails' - get emails sorted by frequency (how often they appear), "
                     "'draft' - create a draft email for user to review (requires 'to', 'subject', 'body' parameters)."
                 )
             },
             "max_results" : {
                 "type": "integer",
                 "description": "Maximum number of results to return (for list_recent, search, or top_emails). Default: 10",
                 "default": 10,
         },
                "query" : {
                    "type" : "string",
                    "description": "Gmail search query (required for action='search'). Examples: 'from:example.com', 'subject:meeting', 'newer_than:7d'",
                },
                "to" : {
                    "type" : "string",
                    "description" : "Recipient email address (required for action='send')",
                },
                "subject" : {
                    "type" : "string",
                    "description" : "Email subject line (required for action='send')",
                },
                "body" : {
                    "type" : "string",
                    "description" : "Email body text (required for action='send')",
                },
         },
         "required" : ["action"],
    },
    handler = gmail_tool_handler,
)
<<<<<<< HEAD
register_tool(gmail_tool)

# MCP TOOL Handler

def mcp_tool_handler(args: Dict[str, Any], config: Dict[str, Any]) -> str:
    """ 
    
    Generic MCP Proxy tool handler.
    
    How it is called:
    
    The LLM calls the "mcp" tool with arguments:
    {
        "tool_name":"<name of the tool>"
        "arguments":{...arguments for that tool...}
    }
    
    -`config` is provided by the your runtime/local_resolver and should contain:
    {
        "endpoint":"http://localhost9000",
        "config_json":{ ...optional config... }
    }
    
    What It Does:
    1. Validates that endpoint is present.
    2. Builds a lightweight server-like object with .endpoint and .config_json attributes.
    3. Uses call_mcp_tool(server, tool_name, arguments) to talk to the MCP server.
    4. Returns the result string back to the LLM.
    
    Important:
    - This handler does not know which mcp tools exist; it just forwards calls.
    - The MCP HTTP server is responsible for validating tool_name and arguments.
    
    """
    # Tool extraction
    tool_name = args.get("tool_name")or args.get("tool")
    tool_args = args.get("arguments") or {}
    
    if not tool_name:
        raise ValueError("mcp tool requires 'tool_name' in arguments." )
    
    # Extract MCP server config from config
    endpoint = config.get("endpoint")
    server_config_json = config.get("config_json") or {}
    
    # 3. Build a lightweight MCP Server - like object so we can reuse call_mcp_tool
    class _SimpleServer:
        def __init__(self,endpoint:str, config_json:dict[str,Any]):
            self.endpoint = endpoint
            self.config_json = config_json
            
    server_obj = _SimpleServer(endpoint=endpoint, config_json=server_config_json)
    
    # 4 cal the MCP Server via our HTTP Client
    try: 
        result = call_mcp_tool(
            server = server_obj,   # has endpoint + config_json
            tool_name = tool_name,
            arguments = tool_args,
        )
    except MCPClientError as e:
        return f"[MCP Error] {str(e)}"
    
    return result

# Register MCP tool

mcp_tool = ToolDefinition(
    name = "mcp",
    description = (
        "Proxy tool for calling tools exposed by a connected MCP server. "
        "Use this when you need to call external tools like filesystem search,"
        "codebase search, etc. Always specify which MCP tool to call in 'tool_name'"
        "and pass a JSON object of arguments in 'arguments'"
    ),
    parameters = {
        "type": "object",
        "properties":{
            "tool_name":{
                "type": "string",
                "description": "The name of the MCP tool to call (e.g. 'search_files')",
            },
            "arguments":{
                "type":"object",
                "description":"Arguments for the MCP tool, following its JSON schema.",
                "additionalProperties": True,
            },
        },
        "required": ["tool_name"],
    },
    handler = mcp_tool_handler,
)
TOOL_REGISTRY.register(mcp_tool)
            
=======
register_tool(gmail_tool)
>>>>>>> origin/main
