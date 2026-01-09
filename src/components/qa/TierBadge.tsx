
import { Badge } from "@/components/ui/badge";

interface TierBadgeProps {
    tier: string; // Bronze, Silver, Gold, Platinum, Diamond
    className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
    let colorClass = "bg-slate-400"; // Default Bronze-ish

    switch (tier?.toLowerCase()) {
        case 'bronze':
            colorClass = "bg-amber-700 text-white border-amber-800";
            break;
        case 'silver':
            colorClass = "bg-slate-300 text-slate-900 border-slate-400";
            break;
        case 'gold':
            colorClass = "bg-yellow-400 text-yellow-900 border-yellow-500";
            break;
        case 'platinum':
            colorClass = "bg-cyan-100 text-cyan-900 border-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.5)]";
            break;
        case 'diamond':
            colorClass = "bg-gradient-to-r from-cyan-400 to-blue-500 text-white border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.7)]";
            break;
    }

    return (
        <Badge variant="outline" className={`${colorClass} ${className} capitalize`}>
            {tier || 'Bronze'}
        </Badge>
    );
}
