import type { Board, CreateBoardInput } from '$lib/components/app/types';
import { getDb, BoardRepo } from '$lib/db';

let _boards = $state<Board[]>([]);
let _active = $state<Board | null>(null);
let _loading = $state(false);

export function useBoards(getWorkspacePath: () => string | null) {
    function requireWorkspacePath(): string {
        const path = getWorkspacePath();
        if (!path) throw new Error('No workspace selected');
        return path;
    }

    async function load() {
        const workspacePath = getWorkspacePath();
        if (!workspacePath) {
            _boards = [];
            _active = null;
            return;
        }

        _loading = true;
        try {
            const db = await getDb(workspacePath);
            // Load initial 50 boards
            _boards = await BoardRepo.listBoards(db, { limit: 50 });
            // Auto-select first board if none active
            if (!_active && _boards.length > 0) {
                _active = _boards[0];
            }
        } finally {
            _loading = false;
        }
    }

    async function loadMore() {
        const workspacePath = getWorkspacePath();
        if (!workspacePath) return;

        const db = await getDb(workspacePath);
        const batch = await BoardRepo.listBoards(db, { 
            limit: 50, 
            offset: _boards.length 
        });

        _boards = [..._boards, ...batch];
    }

    async function create(input: CreateBoardInput) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const board = await BoardRepo.createBoard(db, input);
        _boards = [..._boards, board];
        _active = board; // auto-activate newly created board
        return board;
    }

    async function remove(id: string) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        await BoardRepo.deleteBoard(db, id);
        _boards = _boards.filter(b => b.id !== id);
        // If deleted board was active, fall back to first remaining
        if (_active?.id === id) {
            _active = _boards[0] ?? null;
        }
    }

    async function rename(id: string, name: string, description: string) {
        const workspacePath = requireWorkspacePath();
        const db = await getDb(workspacePath);
        const updated = await BoardRepo.renameBoard(db, id, name, description);
        if (!updated) throw new Error('Board not found');

        _boards = _boards.map((board) =>
            board.id === id ? updated : board,
        );

        if (_active?.id === id) {
            _active = updated;
        }

        return updated;
    }

    function setActive(board: Board) {
        _active = board;
    }

    return {
        get boards() { return _boards },
        get active() { return _active },
        get loading() { return _loading },
        load, loadMore, create, remove, rename, setActive
    };
}
