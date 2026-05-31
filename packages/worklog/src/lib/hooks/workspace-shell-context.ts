import { createContext } from "svelte";

import type { getBoards } from "$lib/hooks/boards.svelte";
import type { getWorkspace } from "$lib/hooks/workspace.svelte";
import type { useTicketTypes } from "$lib/hooks/ticket-types.svelte";

export type WorkspaceApi = ReturnType<typeof getWorkspace>;
export type BoardsApi = ReturnType<typeof getBoards>;
export type TicketTypesApi = ReturnType<typeof useTicketTypes>;

export interface WorkspaceShellContext {
    workspace: WorkspaceApi;
    boardsApi: BoardsApi;
    ticketTypesApi: TicketTypesApi;
}

export const [getWorkspaceShellContext, setWorkspaceShellContext] =
    createContext<WorkspaceShellContext>();
