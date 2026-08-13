import { 
  Eye, Pencil, Trash2, History, Paperclip, Copy, 
  ArrowUp, ArrowDown, ChevronsUpDown, Filter, FilterX, Settings2,
  CheckCircle2, AlertTriangle, XCircle, Info,
  HardDrive, Network, User, FileText, LayoutDashboard,
  RefreshCw, RotateCcw, Undo2, ChevronRight, ChevronDown,
  Maximize2, SlidersHorizontal, Search, X, Check,
  Clock, Calendar, Download, Printer, Link as LinkIcon,
  ShieldCheck, ShieldAlert, AlertCircle, HelpCircle
} from "lucide-react";

export const ICON_REGISTRY = {
  // --- Actions ---
  "action.view": Eye,
  "action.edit": Pencil,
  "action.delete": Trash2,
  "action.history": History,
  "action.attach": Paperclip,
  "action.copy": Copy,
  "action.download": Download,
  "action.print": Printer,
  "action.link": LinkIcon,
  "action.search": Search,
  "action.close": X,
  "action.confirm": Check,

  // --- Table Controls ---
  "table.sortAsc": ArrowUp,
  "table.sortDesc": ArrowDown,
  "table.sortNone": ChevronsUpDown,
  "table.filter": Filter,
  "table.filterActive": FilterX,
  "table.settings": Settings2,
  "table.maximize": Maximize2,
  "table.reset": RotateCcw,
  "table.expand": ChevronRight,
  "table.collapse": ChevronDown,

  // --- Status & Feedback ---
  "status.success": CheckCircle2,
  "status.warning": AlertTriangle,
  "status.danger": XCircle,
  "status.error": AlertCircle,
  "status.info": Info,
  "status.help": HelpCircle,
  "status.loading": RefreshCw,
  "status.undo": Undo2,

  // --- Entities ---
  "entity.asset": HardDrive,
  "entity.system": Network,
  "entity.user": User,
  "entity.document": FileText,
  "entity.dashboard": LayoutDashboard,
  "entity.history": Clock,
  "entity.calendar": Calendar,
  "entity.security": ShieldCheck,
  "entity.securityAlert": ShieldAlert,
} as const;

export type IconName = keyof typeof ICON_REGISTRY;
