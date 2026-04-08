import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight, Download, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle: string;
  breadcrumbs: BreadcrumbItem[];
  onExport?: () => void;
}

const PageHeader = ({ title, subtitle, breadcrumbs, onExport }: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-[11px]">
        <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="w-3 h-3" /> Dashboard
        </Link>
        {breadcrumbs.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            {item.href ? (
              <Link to={item.href} className="text-muted-foreground hover:text-foreground transition-colors">{item.label}</Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Title Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center hover:bg-secondary/80 transition">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold"><span className="gradient-text">{title}</span></h1>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        {onExport && (
          <button onClick={onExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default PageHeader;
