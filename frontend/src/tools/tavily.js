export const tavilyTemplate = {
    template_Key: "tavily",
    name: "Tavily Search",
    description: "AI-powered search API for the web",
    fields:[
        {
            key: "api_key",
            label: "Tavily API Key",
            type: "password",
            required: true,
            placeholder: "Enter your Tavily API Key",
        }
    ],
    buildConfig : (formValues) => ({
        api_key: formValues.api_key
    })

};
