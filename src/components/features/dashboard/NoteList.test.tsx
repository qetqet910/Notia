import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NoteList } from "@/components/features/dashboard/NoteList";
import { useDataStore } from "@/stores/dataStore";
import type { Folder, Note } from "@/types";
import { normalizeFolderPath } from "./main/NoteTree";

const { toastMock } = vi.hoisted(() => ({
	toastMock: vi.fn(),
}));

vi.mock("@/hooks/useToast", () => ({
	useToast: () => ({
		toast: toastMock,
		dismiss: vi.fn(),
		toasts: [],
	}),
}));

const baseDate = "2026-01-01T00:00:00.000Z";

function createNote(overrides: Partial<Note>): Note {
	return {
		id: overrides.id ?? "note-id",
		title: overrides.title ?? "Untitled",
		content: overrides.content ?? "",
		content_preview: overrides.content_preview ?? "",
		tags: overrides.tags ?? [],
		reminders: overrides.reminders ?? [],
		owner_id: overrides.owner_id ?? "owner-1",
		is_public: overrides.is_public ?? false,
		is_pinned: overrides.is_pinned ?? false,
		created_at: overrides.created_at ?? baseDate,
		updated_at: overrides.updated_at ?? baseDate,
		createdAt: overrides.createdAt ?? new Date(baseDate),
		updatedAt: overrides.updatedAt ?? new Date(baseDate),
		folder_path: overrides.folder_path ?? "/",
		parent_id: overrides.parent_id ?? null,
		note_type: overrides.note_type,
		deleted_at: overrides.deleted_at,
	};
}

function createFolder(path: string): Folder {
	const normalizedPath = normalizeFolderPath(path);
	const lastSlashIndex = normalizedPath.lastIndexOf("/");
	const parentPath =
		normalizedPath === "/"
			? null
			: lastSlashIndex <= 0
				? "/"
				: normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));

	return {
		id: `folder-${normalizedPath}`,
		owner_id: "owner-1",
		path: normalizedPath,
		name: normalizedPath === "/" ? "/" : normalizedPath.split("/").pop() ?? "",
		parent_path: parentPath,
		sort_index: 0,
		created_at: baseDate,
		updated_at: baseDate,
		deleted_at: null,
	};
}

function toFolderMap(paths: string[]): Record<string, Folder> {
	return paths.reduce<Record<string, Folder>>((acc, path) => {
		const normalizedPath = normalizeFolderPath(path);
		acc[normalizedPath] = createFolder(normalizedPath);
		return acc;
	}, {});
}

function installFolderActionMocks(initialPaths: string[]) {
	useDataStore.setState({ folders: toFolderMap(initialPaths) });

	const createFolderMock = vi.fn((path: string) => {
		const normalizedPath = normalizeFolderPath(path);
		const segments = normalizedPath.slice(1).split("/").filter(Boolean);
		const toEnsure: string[] = [];
		let current = "";

		for (const segment of segments) {
			current = `${current}/${segment}`;
			toEnsure.push(normalizeFolderPath(current));
		}

		useDataStore.setState((state) => {
			const nextFolders = { ...state.folders };
			for (const folderPath of toEnsure) {
				nextFolders[folderPath] = createFolder(folderPath);
			}
			return { folders: nextFolders };
		});

		return normalizedPath;
	});

	const renameFolderMock = vi.fn(async (oldPath: string, newPath: string) => {
		const normalizedOldPath = normalizeFolderPath(oldPath);
		const normalizedNewPath = normalizeFolderPath(newPath);

		useDataStore.setState((state) => {
			const nextFolders: Record<string, Folder> = {};
			for (const folder of Object.values(state.folders)) {
				const currentPath = normalizeFolderPath(folder.path);
				if (
					currentPath === normalizedOldPath ||
					currentPath.startsWith(`${normalizedOldPath}/`)
				) {
					const suffix = currentPath.slice(normalizedOldPath.length);
					const remappedPath = normalizeFolderPath(`${normalizedNewPath}${suffix}`);
					nextFolders[remappedPath] = createFolder(remappedPath);
				} else {
					nextFolders[currentPath] = folder;
				}
			}
			return { folders: nextFolders };
		});
	});

	const deleteFolderMock = vi.fn(async (path: string) => {
		const normalizedPath = normalizeFolderPath(path);
		useDataStore.setState((state) => {
			const nextFolders: Record<string, Folder> = {};
			for (const [folderPath, folder] of Object.entries(state.folders)) {
				if (
					folderPath === normalizedPath ||
					folderPath.startsWith(`${normalizedPath}/`)
				) {
					continue;
				}
				nextFolders[folderPath] = folder;
			}
			return { folders: nextFolders };
		});
	});

	useDataStore.setState({
		createFolder: createFolderMock,
		renameFolder: renameFolderMock,
		deleteFolder: deleteFolderMock,
	});

	return { createFolderMock, renameFolderMock, deleteFolderMock };
}

beforeEach(() => {
	useDataStore.setState({ folders: {} });
	toastMock.mockReset();
});

describe("NoteList tree mode folder sync", () => {
	it("shows a wiki-opened note by syncing selected folder and auto-expanding ancestors", async () => {
		const alphaNote = createNote({
			id: "alpha-1",
			title: "Alpha Note",
			folder_path: "/alpha",
		});
		const betaNestedNote = createNote({
			id: "beta-sub-1",
			title: "Beta Nested Note",
			folder_path: "/beta/sub",
		});

		const onSelectNote = vi.fn();
		const onTogglePin = vi.fn();

		const { rerender } = render(
			<NoteList
				notes={[alphaNote, betaNestedNote]}
				selectedNote={alphaNote}
				onSelectNote={onSelectNote}
				onTogglePin={onTogglePin}
			/>,
		);

		fireEvent.click(await screen.findByRole("button", { name: /^alpha\s+\d+$/i }));

		expect(screen.queryByText("Beta Nested Note")).not.toBeInTheDocument();

		rerender(
			<NoteList
				notes={[alphaNote, betaNestedNote]}
				selectedNote={betaNestedNote}
				onSelectNote={onSelectNote}
				onTogglePin={onTogglePin}
			/>,
		);

		await waitFor(() => {
			expect(screen.getByText("Beta Nested Note")).toBeInTheDocument();
		});
	});

	it("does not override root folder selection when selectedFolderPath is root", async () => {
		const alphaNote = createNote({
			id: "alpha-1",
			title: "Alpha Root Visible",
			folder_path: "/alpha",
		});
		const betaNote = createNote({
			id: "beta-1",
			title: "Beta Root Visible",
			folder_path: "/beta",
		});

		const onSelectNote = vi.fn();
		const onTogglePin = vi.fn();

		const { rerender } = render(
			<NoteList
				notes={[alphaNote, betaNote]}
				selectedNote={alphaNote}
				onSelectNote={onSelectNote}
				onTogglePin={onTogglePin}
			/>,
		);

		rerender(
			<NoteList
				notes={[alphaNote, betaNote]}
				selectedNote={betaNote}
				onSelectNote={onSelectNote}
				onTogglePin={onTogglePin}
			/>,
		);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: /^alpha\s+\d+$/i }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("button", { name: /^beta\s+\d+$/i }),
			).toBeInTheDocument();
		});
	});

	it("creates a folder through dialog and selects it", async () => {
		const { createFolderMock } = installFolderActionMocks([]);

		render(
			<NoteList
				notes={[]}
				selectedNote={null}
				onSelectNote={vi.fn()}
				onTogglePin={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "새 폴더 만들기" }));

		const input = screen.getByPlaceholderText("예: project/meeting");
		fireEvent.change(input, { target: { value: "project/meeting" } });
		fireEvent.click(screen.getByRole("button", { name: "생성" }));

		await waitFor(() => {
			expect(createFolderMock).toHaveBeenCalledWith("/project/meeting");
		});

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /^project$/i })).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /^meeting$/i })).toBeInTheDocument();
		});
	});

	it("renames a folder from menu and reflects new path", async () => {
		const { renameFolderMock } = installFolderActionMocks(["/work", "/work/sub"]);

		render(
			<NoteList
				notes={[]}
				selectedNote={null}
				onSelectNote={vi.fn()}
				onTogglePin={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /^work\s+\d+$/i }));
		fireEvent.pointerDown(screen.getByRole("button", { name: "work 폴더 메뉴" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "이름 변경" }));

		const input = screen.getByDisplayValue("work");
		fireEvent.change(input, { target: { value: "archive" } });
		fireEvent.click(screen.getByRole("button", { name: "변경" }));

		await waitFor(() => {
			expect(renameFolderMock).toHaveBeenCalledWith("/work", "/archive");
		});

		await waitFor(() => {
			expect(screen.getByRole("button", { name: "archive 폴더 메뉴" })).toBeInTheDocument();
			expect(screen.queryByRole("button", { name: "work 폴더 메뉴" })).not.toBeInTheDocument();
		});
	});

	it("deletes a folder from menu and selects its parent", async () => {
		const { deleteFolderMock } = installFolderActionMocks(["/work", "/work/sub"]);

		render(
			<NoteList
				notes={[]}
				selectedNote={null}
				onSelectNote={vi.fn()}
				onTogglePin={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /^work\s+\d+$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^sub\s+\d+$/i }));

		fireEvent.pointerDown(screen.getByRole("button", { name: "sub 폴더 메뉴" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "폴더 삭제" }));

		await waitFor(() => {
			expect(deleteFolderMock).toHaveBeenCalledWith("/work/sub");
		});

		await waitFor(() => {
			expect(screen.queryByRole("button", { name: /^sub\s+\d+$/i })).not.toBeInTheDocument();
			expect(screen.getByRole("button", { name: /^work\s+\d+$/i })).toBeInTheDocument();
		});
	});

	it("keeps folder selection and shows toast when delete fails", async () => {
		const parentNote = createNote({
			id: "work-note",
			title: "Work Note",
			folder_path: "/work",
		});
		const subNote = createNote({
			id: "sub-note",
			title: "Sub Note",
			folder_path: "/work/sub",
		});

		const { deleteFolderMock } = installFolderActionMocks(["/work", "/work/sub"]);
		deleteFolderMock.mockRejectedValueOnce(new Error("delete failed"));

		render(
			<NoteList
				notes={[parentNote, subNote]}
				selectedNote={null}
				onSelectNote={vi.fn()}
				onTogglePin={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /^work\s+\d+$/i }));
		fireEvent.click(screen.getByRole("button", { name: /^sub\s+\d+$/i }));

		await waitFor(() => {
			expect(screen.getByText("Sub Note")).toBeInTheDocument();
			expect(screen.queryByText("Work Note")).not.toBeInTheDocument();
		});

		fireEvent.pointerDown(screen.getByRole("button", { name: "sub 폴더 메뉴" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "폴더 삭제" }));

		await waitFor(() => {
			expect(deleteFolderMock).toHaveBeenCalledWith("/work/sub");
			expect(toastMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "폴더 삭제 실패",
					variant: "destructive",
				}),
			);
		});

		expect(screen.getByText("Sub Note")).toBeInTheDocument();
		expect(screen.queryByText("Work Note")).not.toBeInTheDocument();
	});

	it("keeps rename dialog open and shows toast when rename fails", async () => {
		const { renameFolderMock } = installFolderActionMocks(["/work"]);
		renameFolderMock.mockRejectedValueOnce(new Error("rename failed"));

		render(
			<NoteList
				notes={[]}
				selectedNote={null}
				onSelectNote={vi.fn()}
				onTogglePin={vi.fn()}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: /^work\s+\d+$/i }));
		fireEvent.pointerDown(screen.getByRole("button", { name: "work 폴더 메뉴" }));
		fireEvent.click(await screen.findByRole("menuitem", { name: "이름 변경" }));

		const input = screen.getByDisplayValue("work");
		fireEvent.change(input, { target: { value: "archive" } });
		fireEvent.click(screen.getByRole("button", { name: "변경" }));

		await waitFor(() => {
			expect(renameFolderMock).toHaveBeenCalledWith("/work", "/archive");
			expect(toastMock).toHaveBeenCalledWith(
				expect.objectContaining({
					title: "폴더 이름 변경 실패",
					variant: "destructive",
				}),
			);
		});

		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(screen.getByDisplayValue("archive")).toBeInTheDocument();
	});
});
