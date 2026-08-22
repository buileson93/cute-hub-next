import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, AlertCircle } from "lucide-react";

interface BettingCandidate {
  id: string;
  title: string;
  outcome: string;
  appetite: "small" | "big";
  confidence: "high" | "medium" | "low";
  risk: "low" | "medium" | "high";
}

export function BettingTable({
  candidates,
  onDecision,
}: {
  candidates: BettingCandidate[];
  onDecision?: (id: string, decision: "bet" | "hold" | "archive") => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow>
            <TableHead className="w-[30%]">Pitch Candidate</TableHead>
            <TableHead>Expected Outcome</TableHead>
            <TableHead>Appetite</TableHead>
            <TableHead>Confidence</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead className="text-right">Decision</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.map((c) => (
            <TableRow key={c.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell>
                <div className="font-bold text-slate-900">{c.title}</div>
              </TableCell>
              <TableCell className="text-xs text-slate-600 italic">{c.outcome}</TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    c.appetite === "big"
                      ? "border-indigo-200 text-indigo-700 bg-indigo-50"
                      : "border-slate-200 text-slate-600 bg-slate-50"
                  }
                >
                  {c.appetite === "big" ? "6 Weeks" : "2 Weeks"}
                </Badge>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <div
                    className={
                      c.confidence === "high"
                        ? "w-1.5 h-1.5 rounded-full bg-emerald-500"
                        : "w-1.5 h-1.5 rounded-full bg-amber-500"
                    }
                  />
                  {c.confidence.toUpperCase()}
                </span>
              </TableCell>
              <TableCell>
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  {c.risk === "high" ? (
                    <AlertCircle className="h-3 w-3 text-rose-500" />
                  ) : (
                    <Clock className="h-3 w-3 text-slate-400" />
                  )}
                  {c.risk.toUpperCase()}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50"
                    title="Bet this cycle"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-amber-600 hover:bg-amber-50"
                    title="Hold for shaping"
                  >
                    <Clock className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                    title="Archive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
