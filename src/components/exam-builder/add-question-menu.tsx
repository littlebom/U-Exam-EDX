"use client";

import { Plus, Library, Shuffle, FilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AddQuestionMenuProps {
  onPickFromBank: () => void;
  onRandomize: () => void;
  onCreateNew: () => void;
}

export function AddQuestionMenu({
  onPickFromBank,
  onRandomize,
  onCreateNew,
}: AddQuestionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          เพิ่มข้อสอบ
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={onPickFromBank} className="gap-2">
          <Library className="h-4 w-4" />
          เลือกจากคลังข้อสอบ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onRandomize} className="gap-2">
          <Shuffle className="h-4 w-4" />
          สุ่มข้อสอบ
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCreateNew} className="gap-2">
          <FilePlus className="h-4 w-4" />
          สร้างข้อสอบใหม่
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
