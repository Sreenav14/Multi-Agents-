import {tavilyTemplate} from "./tavily";

export const TOOL_TEMPLATES = [
    tavilyTemplate,
    // Add more tool templates here
];

export type ToolTemplate = typeof TOOL_TEMPLATES[number];