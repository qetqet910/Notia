import { invoke } from "@tauri-apps/api/core";
import FolderPlus from "lucide-react/dist/esm/icons/folder-plus";
import Search from "lucide-react/dist/esm/icons/search";
import List from "lucide-react/dist/esm/icons/list";
import Share2 from "lucide-react/dist/esm/icons/share-2";
import { type FC, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { useDataStore } from "@/stores/dataStore";
import type { Note } from "@/types";
import { isTauri } from "@/utils/isTauri";
import { FolderBreadcrumb } from "./main/FolderBreadcrumb";
import { NoteTree, normalizeFolderPath } from "./main/NoteTree";
import { WikiLinkGraph } from "./main/WikiLinkGraph";

interface NoteListProps {
	notes: Note[];
	selectedNote: Note | null;
	onSelectNote: (note: Note) => void;
	onTogglePin: (noteId: string) => void;
	onWikiLinkClick?: (title: string) => void;
}

export const NoteList: FC<NoteListProps> = ({
	notes,
	selectedNote,
	onSelectNote,
	onTogglePin,
	onWikiLinkClick,
}) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [filteredNotes, setFilteredNotes] = useState<Note[]>(notes);
	const [selectedFolderPath, setSelectedFolderPath] = useState("/");
	const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
	const [folderDialogMode, setFolderDialogMode] = useState<"create" | "rename">("create");
	const [folderDialogPath, setFolderDialogPath] = useState("/");
	const [folderInput, setFolderInput] = useState("");
	const [activeTab, setActiveTab] = useState("list");

	// Debounce search term
	const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

	const folders = useDataStore((state) => state.folders);
	const { toast } = useToast();

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearchTerm(searchTerm);
		}, 200);
		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		if (!selectedNote) {
			return;
		}

		const normalizedSelectedFolderPath = normalizeFolderPath(selectedFolderPath);
		const noteFolderPath = normalizeFolderPath(selectedNote.folder_path ?? "/");

		// Always sync if root is selected or if the note is outside current folder filter
		const isSameFolder = noteFolderPath === normalizedSelectedFolderPath;
		const isDescendantFolder = noteFolderPath.startsWith(
			`${normalizedSelectedFolderPath}/`,
		);

		if (!isSameFolder && !isDescendantFolder) {
			setSelectedFolderPath(noteFolderPath);
		}
	}, [selectedNote, selectedFolderPath]);

	useEffect(() => {
		const performSearch = async () => {
			if (!debouncedSearchTerm.trim()) {
				setFilteredNotes(
					[...notes].sort((a, b) => {
						const pinDiff =
							Number(b.is_pinned || false) - Number(a.is_pinned || false);
						if (pinDiff !== 0) return pinDiff;
						return (
							new Date(b.updated_at).getTime() -
							new Date(a.updated_at).getTime()
						);
					}),
				);
				return;
			}

			if (isTauri()) {
				try {
					const filteredIds = await invoke<string[]>("search_notes", {
						notes,
						query: debouncedSearchTerm,
					});
					const filteredIdSet = new Set(filteredIds);

					const filtered = notes.filter((note) => filteredIdSet.has(note.id));
					// Sort filtered results by pin then update time
					filtered.sort((a, b) => {
						const pinDiff =
							Number(b.is_pinned || false) - Number(a.is_pinned || false);
						if (pinDiff !== 0) return pinDiff;
						return (
							new Date(b.updated_at).getTime() -
							new Date(a.updated_at).getTime()
						);
					});
					setFilteredNotes(filtered);
				} catch (error) {
					console.error("Rust search failed:", error);
					// Fallback to JS filtering
					filterNotesJs();
				}
			} else {
				filterNotesJs();
			}
		};

		const filterNotesJs = () => {
			const lowerQuery = debouncedSearchTerm.toLowerCase();
			const filtered = notes
				.filter(
					(note) =>
						note.title.toLowerCase().includes(lowerQuery) ||
						(note.content_preview || "").toLowerCase().includes(lowerQuery) ||
						(note.tags || []).some((tag) =>
							tag.toLowerCase().includes(lowerQuery),
						),
				)
				.sort((a, b) => {
					const pinDiff =
						Number(b.is_pinned || false) - Number(a.is_pinned || false);
					if (pinDiff !== 0) return pinDiff;
					return (
						new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
					);
				});
			setFilteredNotes(filtered);
		};

		performSearch();
	}, [debouncedSearchTerm, notes]);

	// Radix UI Dialog 닫힘 버그 (pointer-events: none 잔류) 패치
	useEffect(() => {
		if (!isFolderDialogOpen) {
			setTimeout(() => {
				document.body.style.pointerEvents = "";
			}, 100);
		}
	}, [isFolderDialogOpen]);

	const treeNotes = useMemo(() => {
		const normalizedSelectedFolderPath = normalizeFolderPath(selectedFolderPath);
		if (normalizedSelectedFolderPath === "/") {
			return filteredNotes;
		}

		return filteredNotes.filter((note) => {
			const noteFolderPath = normalizeFolderPath(note.folder_path ?? "/");
			return (
				noteFolderPath === normalizedSelectedFolderPath ||
				noteFolderPath.startsWith(`${normalizedSelectedFolderPath}/`)
			);
		});
	}, [filteredNotes, selectedFolderPath]);

	const folderPaths = useMemo(() => Object.keys(folders), [folders]);

	const openCreateFolderDialog = (parentPath: string) => {
		setFolderDialogMode("create");
		setFolderDialogPath(normalizeFolderPath(parentPath));
		setFolderInput("");
		setIsFolderDialogOpen(true);
	};

	const openRenameFolderDialog = (path: string) => {
		const normalizedPath = normalizeFolderPath(path);
		setFolderDialogMode("rename");
		setFolderDialogPath(normalizedPath);
		setFolderInput(normalizedPath === "/" ? "" : normalizedPath.split("/").pop() ?? "");
		setIsFolderDialogOpen(true);
	};

	const resolveCreatePath = (parentPath: string, value: string) => {
		if (value.startsWith("/")) {
			return normalizeFolderPath(value);
		}

		const normalizedParentPath = normalizeFolderPath(parentPath);
		if (normalizedParentPath === "/") {
			return normalizeFolderPath(value);
		}

		return normalizeFolderPath(`${normalizedParentPath}/${value}`);
	};

	const resolveRenamePath = (sourcePath: string, value: string) => {
		if (value.startsWith("/")) {
			return normalizeFolderPath(value);
		}

		const normalizedSourcePath = normalizeFolderPath(sourcePath);
		const lastSlashIndex = normalizedSourcePath.lastIndexOf("/");
		const parentPath =
			lastSlashIndex <= 0
				? "/"
				: normalizeFolderPath(normalizedSourcePath.slice(0, lastSlashIndex));

		if (parentPath === "/") {
			return normalizeFolderPath(value);
		}

		return normalizeFolderPath(`${parentPath}/${value}`);
	};

	const remapSelectedPath = (path: string, oldPath: string, newPath: string) => {
		const normalizedPath = normalizeFolderPath(path);
		const normalizedOldPath = normalizeFolderPath(oldPath);
		const normalizedNewPath = normalizeFolderPath(newPath);

		if (normalizedPath === normalizedOldPath) {
			return normalizedNewPath;
		}

		if (!normalizedPath.startsWith(`${normalizedOldPath}/`)) {
			return normalizedPath;
		}

		const suffix = normalizedPath.slice(normalizedOldPath.length);
		return normalizeFolderPath(`${normalizedNewPath}${suffix}`);
	};

	const getParentFolderPath = (path: string) => {
		const normalizedPath = normalizeFolderPath(path);
		if (normalizedPath === "/") {
			return "/";
		}

		const lastSlashIndex = normalizedPath.lastIndexOf("/");
		if (lastSlashIndex <= 0) {
			return "/";
		}

		return normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));
	};

	const handleFolderDialogSubmit = async () => {
		const trimmed = folderInput.trim();
		if (!trimmed) {
			return;
		}

		if (folderDialogMode === "create") {
			const createdPath = useDataStore
				.getState()
				.createFolder(resolveCreatePath(folderDialogPath, trimmed));
			setSelectedFolderPath(createdPath);
			setIsFolderDialogOpen(false);
			return;
		}

		const targetPath = resolveRenamePath(folderDialogPath, trimmed);
		try {
			await useDataStore.getState().renameFolder(folderDialogPath, targetPath);
			setSelectedFolderPath((prev) => remapSelectedPath(prev, folderDialogPath, targetPath));
			setIsFolderDialogOpen(false);
		} catch (error) {
			console.error("Failed to rename folder:", error);
			toast({
				title: "폴더 이름 변경 실패",
				description:
					error instanceof Error
						? error.message
						: "폴더 이름 변경 중 오류가 발생했습니다.",
				variant: "destructive",
			});
		}
	};

	const handleDeleteFolder = async (path: string) => {
		const normalizedPath = normalizeFolderPath(path);
		try {
			await useDataStore.getState().deleteFolder(normalizedPath);
			const parentPath = getParentFolderPath(normalizedPath);
			setSelectedFolderPath((prev) => {
				const normalizedSelectedPath = normalizeFolderPath(prev);
				if (
					normalizedSelectedPath === normalizedPath ||
					normalizedSelectedPath.startsWith(`${normalizedPath}/`)
				) {
					return parentPath;
				}
				return normalizedSelectedPath;
			});
		} catch (error) {
			console.error("Failed to delete folder:", error);
			toast({
				title: "폴더 삭제 실패",
				description:
					error instanceof Error
						? error.message
						: "폴더 삭제 중 오류가 발생했습니다.",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="flex flex-col h-full">
			<div className="p-3 border-b pt-4">
				<div className="flex items-center gap-2 mb-2">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="list" className="flex items-center gap-2">
								<List className="h-4 w-4" />
								<span>노트</span>
							</TabsTrigger>
							<TabsTrigger value="graph" className="flex items-center gap-2">
								<Share2 className="h-4 w-4" />
								<span>그래프</span>
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>

				<div className="flex items-center gap-2">
					<div className="relative flex-1">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="text"
							placeholder="노트 검색..."
							className="pl-8"
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
						/>
					</div>
					<Button
						type="button"
						variant="outline"
						size="icon"
						onClick={() => openCreateFolderDialog(selectedFolderPath)}
						aria-label="새 폴더 만들기"
					>
						<FolderPlus className="h-4 w-4" />
					</Button>
				</div>
				{activeTab === "list" && (
					<FolderBreadcrumb
						selectedFolderPath={selectedFolderPath}
						onSelectFolder={setSelectedFolderPath}
					/>
				)}
			</div>

			<div className="flex-1 overflow-hidden">
				{activeTab === "list" ? (
					<ScrollArea className="h-full">
						<NoteTree
							notes={filteredNotes}
							folderPaths={folderPaths}
							selectedNote={selectedNote}
							selectedFolderPath={selectedFolderPath}
							onSelectNote={onSelectNote}
							onSelectFolder={setSelectedFolderPath}
							onTogglePin={onTogglePin}
							onRequestCreateFolder={openCreateFolderDialog}
							onRequestRenameFolder={openRenameFolderDialog}
							onDeleteFolder={handleDeleteFolder}
						/>
					</ScrollArea>
				) : (
					<div className="h-full p-2">
						<WikiLinkGraph 
							notes={filteredNotes} 
							onWikiLinkClick={onWikiLinkClick || (() => {})} 
						/>
					</div>
				)}
			</div>

			<Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
				<DialogContent className="sm:max-w-[420px]">
					<DialogHeader>
						<DialogTitle>
							{folderDialogMode === "create" ? "새 폴더 만들기" : "폴더 이름 변경"}
						</DialogTitle>
					</DialogHeader>
					<div className="py-2">
						<Input
							autoFocus
							value={folderInput}
							onChange={(event) => setFolderInput(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									void handleFolderDialogSubmit();
								}
							}}
							placeholder={
								folderDialogMode === "create"
									? "예: project/meeting"
									: "새 폴더 이름"
							}
						/>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
							취소
						</Button>
						<Button onClick={() => void handleFolderDialogSubmit()}>
							{folderDialogMode === "create" ? "생성" : "변경"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
