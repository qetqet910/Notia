import React, {useEffect, useState} from 'react';
import {getCurrentWindow} from '@tauri-apps/api/window';
import {exit} from '@tauri-apps/plugin-process';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {isTauri} from '@/utils/isTauri';

export const CloseHandler: React.FC = () => {
    const [showDialog, setShowDialog] = useState(false);

    useEffect(() => {
        if (!isTauri()) return;

        const appWindow = getCurrentWindow();

        // Tauri window event listener
        const unlisten = appWindow.onCloseRequested(async (event) => {
            // Prevent the default close behavior
            event.preventDefault();
            setShowDialog(true);
        });

        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    const handleMinimize = async () => {
        setShowDialog(false);
        await getCurrentWindow().hide();
    };

    const handleExit = async () => {
        setShowDialog(false);
        await exit(0);
    };

    return (
        <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>앱 종료</AlertDialogTitle>
                    <AlertDialogDescription>
                        Notia를 종료하시겠습니까?
                        <br/>
                        최소화하면 시스템 트레이에서 계속 실행됩니다.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowDialog(false)}>취소</AlertDialogCancel>
                    <AlertDialogAction onClick={handleMinimize} className="bg-blue-600 hover:bg-blue-700 text-white">
                        최소화 (트레이)
                    </AlertDialogAction>
                    <AlertDialogAction onClick={handleExit} className="bg-destructive hover:bg-destructive/90">
                        종료
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
