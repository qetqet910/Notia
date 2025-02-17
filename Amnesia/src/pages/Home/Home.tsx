import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Calendar, Tags, Tag, ChevronLeft, ChevronRight, Plus, Menu, Filter, BookText, Search, Moon, Sun } from "lucide-react"
import { Editor } from "../../components/features/Editor/Editor"
import { NoteList } from "../../components/features/NoteList/NoteList"
import { useTags } from "../../hooks/useTags"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/ui/Logo"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export const HomePage: React.FC = () => {
  const { allTags, selectedTag, setSelectedTag } = useTags()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isNewNote, setIsNewNote] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  const menuItems = [
    { icon: <Home className="w-5 h-5" />, text: "Home", tooltip: "View all notes" },
    { icon: <Tags className="w-5 h-5" />, text: "Labels", tooltip: "View by tags" },
    { icon: <Calendar className="w-5 h-5" />, text: "Today", tooltip: "Today's notes" },
    { icon: <BookText className="w-5 h-5" />, text: "Tomorrow", tooltip: "Tomorrow's notes" },
    { icon: <Filter className="w-5 h-5" />, text: "Filters", tooltip: "Filters & labels" }
  ]

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      {/* Enhanced Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: isSidebarOpen ? "auto" : "0px" }}
        className={cn(
          "relative",
          isSidebarOpen ? "w-96" : "w-0",
          "bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700",
          "shadow-lg shadow-gray-100/50 dark:shadow-none overflow-hidden transition-all duration-300"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Enhanced Logo Section */}
          <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 dark:from-violet-900/20 dark:to-fuchsia-900/20">
            <Logo className="h-16 w-auto transform hover:scale-105 transition-transform" />
          </div>

          {/* Enhanced Search */}
          <div className="px-6 pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search notes..."
                className="pl-10 bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Enhanced Navigation */}
          <ScrollArea className="flex-1 px-4 py-6">
            <nav>
              <TooltipProvider>
                <ul className="space-y-2">
                  {menuItems.map((item, index) => (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <li>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-gray-700 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 font-medium text-base"
                          >
                            {item.icon}
                            <span className="ml-3">{item.text}</span>
                          </Button>
                        </li>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="bg-gray-800 text-white">
                        <p>{item.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </ul>
              </TooltipProvider>

              {/* Enhanced Tags Section */}
              <div className="mt-8">
                <div className="px-3 mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Labels</h2>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-violet-50 dark:hover:bg-violet-900/20">
                    <Plus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </Button>
                </div>
                <ul className="space-y-1">
                  {allTags.map((tag) => (
                    <li key={tag}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-start group text-sm",
                          selectedTag === tag
                            ? "bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-400"
                            : "text-gray-700 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        )}
                        onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                      >
                        <Tag className={cn(
                          "w-4 h-4",
                          selectedTag === tag ? "text-violet-500" : "text-gray-400 group-hover:text-violet-500"
                        )} />
                        <span className="ml-3 font-medium">{tag}</span>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </nav>
          </ScrollArea>
        </div>

        {/* Enhanced Sidebar Toggle */}
        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 rounded-full shadow-md border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-violet-50 dark:hover:bg-violet-900/20"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </motion.div>

      {/* Enhanced Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Enhanced Header */}
        <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-8 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {!isSidebarOpen && (
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="w-5 h-5" />
                </Button>
              )}
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                {selectedTag ? `${selectedTag} Notes` : "All Notes"}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsNewNote(!isNewNote)}
                className="bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Note
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-10 h-10 rounded-full hover:bg-violet-50 dark:hover:bg-violet-900/20"
              >
                {theme === 'light' ? 
                  <Moon className="w-5 h-5 text-gray-700" /> : 
                  <Sun className="w-5 h-5 text-violet-400" />
                }
              </Button>
            </div>
          </div>
        </header>

        {/* Enhanced Content Area */}
        <ScrollArea className="flex-1">
          <div className="max-w-5xl mx-auto px-8 py-8">
            <div className="space-y-6">
              <AnimatePresence>
                {isNewNote && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <Editor />
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <section>
                <NoteList 
                  tagFilter={selectedTag} 
                  searchQuery={searchQuery}
                  className="space-y-4"
                />
              </section>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  )
}



// import * as React from "react"
// import { motion } from "framer-motion"
// import {
//   BookText,
//   Calendar,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Home,
//   Menu,
//   Moon,
//   Plus,
//   Search,
//   Sun,
//   Tag,
//   Tags,
// } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Card } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Separator } from "@/components/ui/separator"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
// import { cn } from "@/lib/utils"

// export const HomePage: React.FC = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)
//   const [isDark, setIsDark] = React.useState(false)
//   const [selectedTag, setSelectedTag] = React.useState<string | null>(null)

//   // Sample data
//   const tags = ["밥먹기", "테스트"]
//   const notes = [
//     { id: 1, title: "오늘 밥 먹기", content: "○○ 그거임", date: "2025-02-17", tags: ["밥먹기"] },
//     { id: 2, title: "테스트 데이터임", content: "밥도 먹고", date: "2025-02-17", tags: ["테스트"] },
//     { id: 3, title: "이것도 그거임", content: "테스트", date: "2025-02-17", tags: ["테스트"] },
//   ]

//   const menuItems = [
//     { icon: Home, label: "Home", description: "모든 노트" },
//     { icon: Tags, label: "Labels", description: "태그별 보기" },
//     { icon: Calendar, label: "Today", description: "오늘의 노트" },
//     { icon: BookText, label: "Tomorrow", description: "내일의 노트" },
//     { icon: Filter, label: "Filters", description: "필터 & 라벨" },
//   ]

//   React.useEffect(() => {
//     document.documentElement.classList.toggle("dark", isDark)
//   }, [isDark])

//   const Sidebar = () => (
//     <div className="flex h-full w-full flex-col gap-4">
//       <div className="flex h-16 items-center justify-between px-6">
//         <div className="flex items-center gap-2">
//           <div className="rounded-lg bg-primary/10 p-2">
//             <BookText className="h-6 w-6 text-primary" />
//           </div>
//           <h1 className="text-xl font-bold">AMNESIA</h1>
//         </div>
//       </div>
//       <Separator />
//       <div className="flex-1 space-y-4 px-4">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
//           <Input className="pl-9" placeholder="메모 검색..." />
//         </div>
//         <nav className="space-y-2">
//           {menuItems.map((item) => (
//             <Button key={item.label} variant="ghost" className="w-full justify-start gap-2 text-base">
//               <item.icon className="h-5 w-5" />
//               {item.label}
//             </Button>
//           ))}
//         </nav>
//         <Separator />
//         <div className="space-y-2">
//           <div className="flex items-center justify-between px-2">
//             <h2 className="text-sm font-semibold">Labels</h2>
//             <Button variant="ghost" size="icon" className="h-8 w-8">
//               <Plus className="h-4 w-4" />
//             </Button>
//           </div>
//           {tags.map((tag) => (
//             <Button
//               key={tag}
//               variant="ghost"
//               className={cn("w-full justify-start gap-2", selectedTag === tag && "bg-accent")}
//               onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
//             >
//               <Tag className="h-4 w-4" />
//               {tag}
//             </Button>
//           ))}
//         </div>
//       </div>
//     </div>
//   )

//   return (
//     <div className="flex h-screen bg-background">
//       {/* Desktop Sidebar */}
//       <motion.aside
//         initial={false}
//         animate={{ width: isSidebarOpen ? 280 : 0 }}
//         className={cn("hidden border-r bg-card lg:block", !isSidebarOpen && "w-0")}
//       >
//         <Sidebar />
//       </motion.aside>

//       {/* Mobile Sidebar */}
//       <Sheet>
//         <SheetTrigger asChild>
//           <Button variant="ghost" size="icon" className="lg:hidden">
//             <Menu className="h-6 w-6" />
//           </Button>
//         </SheetTrigger>
//         <SheetContent side="left" className="w-80 p-0">
//           <Sidebar />
//         </SheetContent>
//       </Sheet>

//       <main className="flex flex-1 flex-col">
//         <header className="sticky top-0 z-10 border-b bg-background px-6 py-3">
//           <div className="flex items-center justify-between gap-4">
//             <div className="flex items-center gap-4">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 className="hidden lg:flex"
//                 onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//               >
//                 {isSidebarOpen ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
//               </Button>
//               <h1 className="text-xl font-semibold">{selectedTag ? `${selectedTag} Notes` : "All Notes"}</h1>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button>
//                 <Plus className="mr-2 h-4 w-4" />
//                 Create Note
//               </Button>
//               <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)}>
//                 {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
//               </Button>
//             </div>
//           </div>
//         </header>

//         <ScrollArea className="flex-1 p-6">
//           <div className="mx-auto max-w-5xl space-y-4">
//             {notes
//               .filter((note) => (selectedTag ? note.tags.includes(selectedTag) : true))
//               .map((note) => (
//                 <Card key={note.id} className="p-4">
//                   <div className="flex items-start justify-between gap-4">
//                     <div className="space-y-1">
//                       <h3 className="font-semibold">{note.title}</h3>
//                       <p className="text-sm text-muted-foreground">{note.content}</p>
//                     </div>
//                     <time className="text-sm text-muted-foreground">{note.date}</time>
//                   </div>
//                   {note.tags.length > 0 && (
//                     <div className="mt-2 flex gap-1">
//                       {note.tags.map((tag) => (
//                         <Button
//                           key={tag}
//                           variant="secondary"
//                           size="sm"
//                           className="h-6 rounded-full"
//                           onClick={() => setSelectedTag(tag)}
//                         >
//                           {tag}
//                         </Button>
//                       ))}
//                     </div>
//                   )}
//                 </Card>
//               ))}
//           </div>
//         </ScrollArea>
//       </main>
//     </div>
//   )
// }

