import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Home from "lucide-react/dist/esm/icons/home";
import type { FC } from "react";

import { Button } from "@/components/ui/button";
import { normalizeFolderPath } from "./NoteTree";

interface FolderBreadcrumbProps {
	selectedFolderPath: string;
	onSelectFolder: (path: string) => void;
}

export const FolderBreadcrumb: FC<FolderBreadcrumbProps> = ({
	selectedFolderPath,
	onSelectFolder,
}) => {
	const normalizedPath = normalizeFolderPath(selectedFolderPath);
	const segments = normalizedPath === "/" ? [] : normalizedPath.slice(1).split("/");

	if (segments.length === 0) return null;

	return (
		<div className="flex items-center gap-1 overflow-x-auto mt-2">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
				onClick={() => onSelectFolder("/")}
				title="모든 폴더로 돌아가기"
			>
				<Home className="h-3.5 w-3.5" />
			</Button>
			{segments.map((segment, index) => {
				const path = normalizeFolderPath(`/${segments.slice(0, index + 1).join("/")}`);

				return (
					<div key={path} className="flex items-center gap-1">
						<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 px-2 text-xs"
							onClick={() => onSelectFolder(path)}
						>
							{segment}
						</Button>
					</div>
				);
			})}
		</div>
	);
};
