import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	useDraggable,
	useDroppable,
	PointerSensor,
	TouchSensor,
	useSensor,
	useSensors,
	closestCenter
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { AnimatePresence, motion } from "framer-motion";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Folder from "lucide-react/dist/esm/icons/folder";
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";

import Pin from "lucide-react/dist/esm/icons/pin";
import { type CSSProperties, type FC, useEffect, useMemo, useState, useRef } from "react";


import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDataStore } from "@/stores/dataStore";
import type { Note } from "@/types";
import { cn } from "@/utils/shadcnUtils";

interface NoteTreeProps {
	notes: Note[];
	folders: Record<string, Folder>; // folderPaths 대신 전체 folders 객체를 받음
	selectedNote: Note | null;
	selectedFolderPath: string;
	onSelectNote: (note: Note) => void;
	onSelectFolder: (path: string) => void;
	onTogglePin: (noteId: string) => void;
	onRequestCreateFolder: (parentPath: string) => void;
	onRequestRenameFolder: (path: string) => void;
	onDeleteFolder: (path: string) => void;
}

interface NoteWithChildren extends Note {
	children: NoteWithChildren[];
}

interface FolderNode {
	id: string; // 고유 ID 추가
	path: string;
	name: string;
	children: FolderNode[];
	notes: NoteWithChildren[];
}

export function normalizeFolderPath(path: string | null | undefined): string {
	if (!path || typeof path !== "string") return "/";
	const trimmed = path.trim();
	if (!trimmed || trimmed === "/") return "/";
	const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
	const collapsed = withLeadingSlash.replace(/\/+/g, "/");
	return collapsed.replace(/\/+$/g, "") || "/";
}

function buildFolderTree(notes: Note[] = [], folders: Record<string, Folder> = {}): FolderNode {
	const root: FolderNode = { id: "root", path: "/", name: "/", children: [], notes: [] };
	if (!notes || !folders) return root;

	const nodeByPath = new Map<string, FolderNode>([["/", root]]);
	const noteById = new Map<string, NoteWithChildren>();

	for (const note of notes) noteById.set(note.id, { ...note, children: [] });

	const ensureNode = (path: string, folderId?: string): FolderNode => {
		const normalizedPath = normalizeFolderPath(path);
		const existing = nodeByPath.get(normalizedPath);
		if (existing) return existing;

		const lastSlashIndex = normalizedPath.lastIndexOf("/");
		const parentPath = lastSlashIndex <= 0 ? "/" : normalizeFolderPath(normalizedPath.slice(0, lastSlashIndex));
		const name = normalizedPath.slice(lastSlashIndex + 1);
		const parent = ensureNode(parentPath);

		const node: FolderNode = { 
			id: folderId || `temp-${normalizedPath}`, 
			path: normalizedPath, 
			name, 
			children: [], 
			notes: [] 
		};
		parent.children.push(node);
		nodeByPath.set(normalizedPath, node);
		return node;
	};

	// 1. 폴더 구조 먼저 생성
	Object.values(folders).forEach((folder) => {
		if (folder.path && folder.path !== "/") {
			ensureNode(folder.path, folder.id);
		}
	});

	// 2. 노트 배치
	for (const note of noteById.values()) {
		if (note.parent_id && noteById.has(note.parent_id)) {
			noteById.get(note.parent_id)!.children.push(note);
		} else {
			const node = ensureNode(normalizeFolderPath(note.folder_path ?? "/"));
			node.notes.push(note);
		}
	}

	const sortTree = (node: FolderNode) => {
		node.children.sort((a, b) => a.path.localeCompare(b.path));
		const sortNestedNotes = (notes: NoteWithChildren[]) => {
			notes.sort((a, b) => {
				const pinDiff = Number(b.is_pinned || false) - Number(a.is_pinned || false);
				if (pinDiff !== 0) return pinDiff;
				return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
			});
			for (const note of notes) if (note.children.length > 0) sortNestedNotes(note.children);
		};
		sortNestedNotes(node.notes);
		for (const child of node.children) sortTree(child);
	};

	sortTree(root);
	return root;
}

const getContentPreview = (previewText: string | null) => {
	if (!previewText) return "미리보기 없음";
	return previewText; // line-clamp-2가 온전히 작동하도록 글자수 강제 절삭 로직 해제
};

const DraggableNoteRow: FC<{
	note: NoteWithChildren;
	depth: number;
	selectedNote: Note | null;
	onSelectNote: (note: Note) => void;
	onTogglePin: (noteId: string) => void;
}> = ({ note, depth, selectedNote, onSelectNote, onTogglePin }) => {
	const [isExpanded, setIsExpanded] = useState(false);
	const hasChildren = note.children.length > 0;

	const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
		id: `note:${note.id}`,
		data: { type: "note", note },
	});

	const { setNodeRef: setDroppableRef, isOver } = useDroppable({
		id: `drop-note:${note.id}`,
		data: { type: "note-drop", path: note.folder_path ?? "/" },
	});

	const setNodeRef = (node: HTMLElement | null) => {
		setDraggableRef(node);
		setDroppableRef(node);
	};

	const style: CSSProperties = {
		transform: CSS.Translate.toString(transform),
		opacity: isDragging ? 0.4 : 1,
	};

	const lastChangedNoteId = useDataStore((state) => state.lastChangedNoteId);
	const setLastChangedNoteId = useDataStore((state) => state.setLastChangedNoteId);
	const isRecentlyChanged = lastChangedNoteId === note.id;

	useEffect(() => {
		if (isRecentlyChanged) {
			const timer = setTimeout(() => {
				setLastChangedNoteId(null);
			}, 3000); // 3초간 효과 유지 후 초기화
			return () => clearTimeout(timer);
		}
	}, [isRecentlyChanged, setLastChangedNoteId]);

	// 깊이가 깊어질 때 패딩을 더 줄여서 콘텐츠 영역 확보
	const calculatedPaddingLeft = Math.min(depth * 8 + 6, 60);

	return (
		<div ref={setNodeRef} style={style} className="relative group w-full min-w-0">
			<motion.div
				key={`${note.id}-${note.updated_at}`}
				className={cn(
					"grid grid-cols-[1fr_22px] items-center py-2 pr-2 transition-colors hover:bg-muted/50 border-b border-border/30 cursor-grab active:cursor-grabbing w-full min-w-0 overflow-hidden",
					selectedNote?.id === note.id ? "bg-muted" : isOver ? "bg-primary/10" : ""
				)}
				animate={isRecentlyChanged ? { 
					backgroundColor: ["rgba(var(--primary-rgb), 0)", "rgba(var(--primary-rgb), 0.1)", "rgba(var(--primary-rgb), 0)"],
					boxShadow: ["0 0 0px rgba(var(--primary-rgb), 0)", "0 0 15px rgba(var(--primary-rgb), 0.4)", "0 0 0px rgba(var(--primary-rgb), 0)"]
				} : {}}
				transition={isRecentlyChanged ? { duration: 2, repeat: 0 } : {}}
				style={{ paddingLeft: `${calculatedPaddingLeft}px` }}
				{...listeners}
				{...attributes}
				onClick={() => onSelectNote(note)}
				data-testid={`note-item-${note.id}`}
			>
				{/* 2. Content Area (Flexible 1fr) */}
				<div className="min-w-0 flex flex-col px-1 overflow-hidden pointer-events-none select-none">
					<h3 className={cn("text-sm font-medium truncate leading-tight", note.is_pinned && "text-orange-600 dark:text-orange-400")}>
						{note.title || "제목 없음"}
					</h3>
					<p className="text-[10px] text-muted-foreground/60 truncate leading-tight mt-1.5">
						{getContentPreview(note.content_preview)}
					</p>
				</div>

				{/* 3. Action Area (Stacked Pin & Date - Fixed 42px) */}
				<div className="flex flex-col items-end justify-center gap-0.5 h-full">
					<Button
						variant="ghost"
						size="icon"
						className={cn(
							"h-5 w-5 transition-opacity shrink-0 pointer-events-auto",
							note.is_pinned ? "opacity-100" : "opacity-0 group-hover:opacity-100"
						)}
						onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
					>
						<Pin className={cn("h-2.5 w-2.5", note.is_pinned ? "fill-orange-500 text-orange-500" : "text-muted-foreground/40")} />
					</Button>
					<span className="text-[8px] text-muted-foreground/40 whitespace-nowrap leading-none pr-1">
						{formatDistanceToNow(new Date(note.updated_at), { addSuffix: false, locale: ko })}
					</span>
				</div>
			</motion.div>

			{isExpanded && hasChildren && (
				<div className="border-l border-border/40 ml-[14px]">
					{note.children.map((child) => (
						<DraggableNoteRow
							key={child.id}
							note={child}
							depth={depth + 1}
							selectedNote={selectedNote}
							onSelectNote={onSelectNote}
							onTogglePin={onTogglePin}
						/>
					))}
				</div>
			)}
		</div>
	);
};

const FolderNodeView: FC<{
	node: FolderNode;
	depth: number;
	expandedPaths: Set<string>;
	onFolderClick: (path: string) => void;
	selectedFolderPath: string;
	onSelectFolder: (path: string) => void;
	selectedNote: Note | null;
	onSelectNote: (note: Note) => void;
	onTogglePin: (noteId: string) => void;
	onRequestCreateFolder: (parentPath: string) => void;
	onRequestRenameFolder: (path: string) => void;
	onDeleteFolder: (path: string) => void;
}> = ({
	node, depth, expandedPaths, onFolderClick, selectedFolderPath, onSelectFolder,
	selectedNote, onSelectNote, onTogglePin, onRequestCreateFolder, onRequestRenameFolder, onDeleteFolder,
}) => {
		const isExpanded = expandedPaths.has(node.path);
		const isSelectedFolder = selectedFolderPath === node.path;
		const { setNodeRef, isOver } = useDroppable({
			id: `folder:${node.path}`,
			data: { type: "folder", path: node.path },
		});

		const calculatedPaddingLeft = Math.min(depth * 6, 60);

		return (
			<div className="w-full min-w-0">
				<div
					ref={setNodeRef}
					className={cn(
						"group flex items-center px-0.5 py-1 border-b border-border/30 transition-colors w-full min-w-0 overflow-hidden",
						isOver ? "bg-primary/15" : isSelectedFolder ? "bg-muted" : "hover:bg-muted/30"
					)}
					style={{ paddingLeft: `${calculatedPaddingLeft}px` }}
				>
					<button
						type="button"
						className="flex min-w-0 flex-1 pl-2 items-center gap-1 text-left overflow-hidden h-7"
						onClick={() => onFolderClick(node.path)}
					>
						<ChevronRight className={cn("h-3 w-3 shrink-0 text-muted-foreground transition-transform", isExpanded && "rotate-90")} />
						<Folder className="h-3 w-3 shrink-0 text-muted-foreground/70" />
						<div className="flex-1 min-w-[30px] flex items-center gap-0.5 overflow-hidden">
							<span className="text-xs font-semibold truncate">{node.name}</span>
							<span className="text-[9px] text-muted-foreground/50 shrink-0">({node.notes.length})</span>
						</div>
					</button>

					<div className="shrink-0 ml-auto pl-1 pr-2">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									size="icon"
									className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
									aria-label={`${node.name} 폴더 메뉴`}
								>
									<MoreHorizontal className="h-3 w-3" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem onClick={() => onRequestCreateFolder(node.path)}>하위 폴더 만들기</DropdownMenuItem>
								{node.path !== "/" && (
									<>
										<DropdownMenuItem onClick={() => onRequestRenameFolder(node.path)}>이름 변경</DropdownMenuItem>
										<DropdownMenuItem className="text-destructive" onClick={() => onDeleteFolder(node.path)}>폴더 삭제</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{/* 애니메이션 제거: removeChild 에러 방지 */}
				{isExpanded && (
					<div className="overflow-hidden">
						{node.notes.map((note) => (
							<DraggableNoteRow 
								key={note.id} 
								note={note} 
								depth={depth + 1} 
								selectedNote={selectedNote} 
								onSelectNote={onSelectNote} 
								onTogglePin={onTogglePin} 
							/>
						))}
						{node.children.map((child) => (
							<FolderNodeView 
								key={child.id} // 경로 대신 고유 ID 사용
								node={child} 
								depth={depth + 1} 
								expandedPaths={expandedPaths} 
								onFolderClick={onFolderClick} 
								selectedFolderPath={selectedFolderPath} 
								onSelectFolder={onSelectFolder} 
								selectedNote={selectedNote} 
								onSelectNote={onSelectNote} 
								onTogglePin={onTogglePin} 
								onRequestCreateFolder={onRequestCreateFolder} 
								onRequestRenameFolder={onRequestRenameFolder} 
								onDeleteFolder={onDeleteFolder} 
							/>
						))}
					</div>
				)}
			</div>
		);
	};

export const NoteTree: FC<NoteTreeProps> = ({
	notes, folders, selectedNote, selectedFolderPath, onSelectNote, onSelectFolder, onTogglePin,
	onRequestCreateFolder, onRequestRenameFolder, onDeleteFolder,
}) => {
	const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["/"]));
	const [activeNote, setActiveNote] = useState<Note | null>(null);
	const prevSelectedPathRef = useRef<string>(selectedFolderPath);

	const folderTree = useMemo(() => buildFolderTree(notes, folders), [folders, notes]);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
		useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
	);

	// Root drop zone logic
	const { setNodeRef: setRootDropRef, isOver: isOverRoot } = useDroppable({
		id: "folder:/",
		data: { type: "folder", path: "/" },
	});

	useEffect(() => {
		if (selectedFolderPath !== prevSelectedPathRef.current) {
			const oldNormalized = normalizeFolderPath(prevSelectedPathRef.current);
			const newNormalized = normalizeFolderPath(selectedFolderPath);
			prevSelectedPathRef.current = selectedFolderPath;

			if (newNormalized === "/") return;

			setExpandedPaths((prev) => {
				const next = new Set(prev);
				// Ensure all parent segments of the new path are expanded
				const segments = newNormalized.split("/").filter(Boolean);
				let currentPath = "";
				for (const segment of segments) {
					currentPath = `${currentPath}/${segment}`;
					next.add(currentPath);
				}
				return next;
			});
		}
	}, [selectedFolderPath]);

	const handleFolderClick = (path: string) => {
		const normalized = normalizeFolderPath(path);
		onSelectFolder(normalized);
		prevSelectedPathRef.current = normalized;
		setExpandedPaths((prev) => {
			const next = new Set(prev);
			if (next.has(normalized)) {
				// If collapsing, we might want to collapse all children too, 
				// but usually just toggling the current one is standard.
				next.delete(normalized);
			} else {
				next.add(normalized);
			}
			return next;
		});
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveNote(event.active.data.current?.note ?? null);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		setActiveNote(null);
		const { active, over } = event;
		if (!over) return;
		const note = active.data.current?.note as Note | undefined;
		const targetPath = over.data.current?.path as string | undefined;
		if (!note || !targetPath) return;
		if (normalizeFolderPath(note.folder_path ?? "/") === normalizeFolderPath(targetPath)) return;
		void useDataStore.getState().moveNote(note.id, normalizeFolderPath(targetPath));
	};

	return (
		<DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd} sensors={sensors} collisionDetection={closestCenter}>
			<div
				className="h-full flex flex-col transition-colors"
			>
				<div className="flex-1 pb-4">
					{/* Root Contents */}
					{folderTree.notes.map((note) => (
						<DraggableNoteRow key={note.id} note={note} depth={0} selectedNote={selectedNote} onSelectNote={onSelectNote} onTogglePin={onTogglePin} />
					))}

					{/* Folder Tree */}
					{folderTree.children.map((child) => (
						<FolderNodeView key={child.path} node={child} depth={0} expandedPaths={expandedPaths} onFolderClick={handleFolderClick} selectedFolderPath={selectedFolderPath} onSelectFolder={onSelectFolder} selectedNote={selectedNote} onSelectNote={onSelectNote} onTogglePin={onTogglePin} onRequestCreateFolder={onRequestCreateFolder} onRequestRenameFolder={onRequestRenameFolder} onDeleteFolder={onDeleteFolder} />
					))}

					{folderTree.notes.length === 0 && folderTree.children.length === 0 && (
						<div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground/50">
							<p className="text-sm italic">노트나 폴더가 없습니다.</p>
						</div>
					)}
				</div>

				{/* Explicit Root Drop Zone */}
				<div
					ref={setRootDropRef}
					className={cn(
						"h-24 w-full flex items-center justify-center border-t border-dashed border-border/40 transition-colors mt-4",
						isOverRoot && activeNote ? "bg-primary/5 border-primary/50 text-foreground" : "text-transparent"
					)}
				>
					<span className="text-sm font-semibold pointer-events-none">이곳에 놓아 상위(루트)로 이동</span>
				</div>
			</div>

			<DragOverlay>
				{activeNote ? (
					<div className="px-3 py-1.5 rounded-md border bg-background shadow-xl text-xs font-medium max-w-48 truncate ring-2 ring-primary/50">
						{activeNote.title || "제목 없음"}
					</div>
				) : null}
			</DragOverlay>
		</DndContext>
	);
};
