import { SYSTEM_PROMPT, clarificationPrompt, analysisPrompt } from "./prompts";
import { DuckSession } from "./session";

export { DuckSession };

export default {
    async fetch(request: Request, env: any): Promise<Response> {
    if (request.method !== "POST") {
        return new Response("Not found", { status: 404 });
    }

    const { sessionId, message } = await request.json<{
        sessionId: string;
        message: string;
    }>();

    const id = env.DUCK_SESSION.idFromName(sessionId);
    const session = env.DUCK_SESSION.get(id);

    const stateRes = await session.fetch(
        new Request("http://internal", {
        method: "POST",
        body: JSON.stringify({ message })
        })
    );

    const sessionState = await stateRes.json();

    const phase = sessionState.phase;
    const prompt =
        phase === "clarification"
        ? clarificationPrompt(message)
        : analysisPrompt(sessionState.messages.join("\n"));

    const aiResponse = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
        ]
    });

    let output = aiResponse.response;

    if (phase === "clarification") {
        try {
        output = JSON.parse(aiResponse.response).questions;
        } catch {
        output = [
            "When does the error occur?",
            "Are there logs or error messages available?"
        ];
        }
    }

    return new Response(
        JSON.stringify({ phase, response: output }),
        { headers: { "Content-Type": "application/json" } }
    );
}
};
