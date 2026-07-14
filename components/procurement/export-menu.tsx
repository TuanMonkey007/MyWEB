"use client";

import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Xuất phiếu theo mẫu CT.MH-QT-01/BM01
export function ExportMenu({ proposalId }: { proposalId: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Download className="size-4" /> Xuất phiếu
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`/api/proposals/${proposalId}/export?format=pdf`}>
            <FileText className="size-4" />
            <div>
              <div>PDF — bản trình ký</div>
              <div className="text-xs text-muted-foreground">
                Không có cột dự trù tiền
              </div>
            </div>
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`/api/proposals/${proposalId}/export?format=xlsx`}>
            <FileSpreadsheet className="size-4" />
            <div>
              <div>Excel — bản nháp</div>
              <div className="text-xs text-muted-foreground">
                Kèm cột dự trù (ngoài vùng in)
              </div>
            </div>
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
