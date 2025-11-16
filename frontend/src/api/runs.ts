// import {apiClient} from "./client";

// // Start a new run for a given assistant.
// //  * Backend expects:
// // *   { "input_text": "..." }
// // * and returns RunWithMessages:
// // *   { id, assistant_id, status, input_text, created_at, completed_at,
// // *     error_message, messages: [...] }

// export async function createRun(assistantId:number,inputText:string){
//     const res = await apiClient.post(`/assistants/${assistantId}/runs`,{input_text:inputText,})
//     return res.data;
// }
// /**
//  * Fetch a past run by id, including its messages.
//  */
// export async function fetchRunById(runId:number){
//     const res = await apiClient.get(`/runs/${runId}`);
//     return res.data;
// }