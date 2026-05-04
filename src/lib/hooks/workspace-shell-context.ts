import { createContext } from "svelte";

import type { useBoards } from "$lib/hooks/boards.svelte";
import type { useWorkspace } from "$lib/hooks/workspace.svelte";
import type { useTicketTypes } from "$lib/hooks/ticket-types.svelte";

export type WorkspaceApi = ReturnType<typeof useWorkspace>;
export type BoardsApi = ReturnType<typeof useBoards>;
export type TicketTypesApi = ReturnType<typeof useTicketTypes>;

export interface WorkspaceShellContext {
    workspace: WorkspaceApi;
    boardsApi: BoardsApi;
    ticketTypesApi: TicketTypesApi;
}

export const [getWorkspaceShellContext, setWorkspaceShellContext] =
    createContext<WorkspaceShellContext>();
