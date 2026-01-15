// Tier system constants
export const TIER_POINTS: Record<string, number> = {
    Bronze: 15,
    Silver: 30,
    Gold: 50,
    Platinum: 75
};

export const TIER_COLORS: Record<string, string> = {
    Bronze: "bg-sol-verified/10 text-sol-verified border-sol-verified/20",
    Silver: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    Gold: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    Platinum: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

// Admin configuration
export const ADMIN_EMAILS = ['bt25csh068@iiitn.ac.in'];

// Helper to check if user is admin
export const isAdminUser = (user: { role?: string; email?: string; id?: number } | null) => {
    if (!user) return false;
    return user.role === 'ADMIN' ||
        (user.email && ADMIN_EMAILS.includes(user.email)) ||
        user.id === 9;
};
