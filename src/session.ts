import type { DurableObjectState } from "@cloudflare/workers-types";

export interface SessionState {
    messages: string[];
    phase: "clarification" | "analysis";
}

export class DuckSession {
    state: DurableObjectState;

    constructor(state: DurableObjectState) {
    this.state = state;
    }

    async fetch(request: Request): Promise<Response> {
    const { message } = await request.json<{ message: string }>();

    const stored =
        (await this.state.storage.get<SessionState>("state")) ??
        ({
        messages: [] as string[],
        phase: "clarification"
        } satisfies SessionState);

    stored.messages.push(message);

    if (stored.phase === "clarification" && stored.messages.length >= 2) {
        stored.phase = "analysis";
    }

    await this.state.storage.put("state", stored);

    return new Response(JSON.stringify(stored), {
        headers: { "Content-Type": "application/json" }
    });
    }
}
