"""
Tool Registry 

this file defines all abailable tools with
1. json schema - tells LLM what parameters each tool accepts
2. Handler - executes the tool with LLM provided arguments

    """
    
from typing import Dict, Any
import requests

from app.tools.definitions import ToolDefinition, TOOL_REGISTRY, register_tool

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
