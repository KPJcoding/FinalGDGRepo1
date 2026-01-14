import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Gift, ShoppingCart, Coins, Package, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Goodie {
    id: number;
    name: string;
    description: string;
    image_url: string;
    cost: number;
    stock: number;
    category: string;
    is_active: number;
}

interface Purchase {
    id: number;
    user_id: number;
    goodie_id: number;
    cost_paid: number;
    status: string;
    created_at: string;
    goodie_name: string;
    description: string;
    image_url: string;
    category: string;
}

export default function Goodies() {
    const { isAuthenticated, user, isLoading, updateUser } = useAuth();
    const navigate = useNavigate();
    const [goodies, setGoodies] = useState<Goodie[]>([]);
    const [loading, setLoading] = useState(true);
    const [userCredits, setUserCredits] = useState(0);
    const [userTier, setUserTier] = useState('Bronze'); // Add tier state
    const [selectedGoodie, setSelectedGoodie] = useState<Goodie | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [showPurchaseHistory, setShowPurchaseHistory] = useState(false);

    useEffect(() => {
        // Don't redirect if still loading auth state
        if (isLoading) return;

        if (!isAuthenticated) {
            navigate("/signin");
            return;
        }
        fetchGoodies();
        fetchUserCredits();
    }, [isAuthenticated, isLoading]);

    const fetchGoodies = async () => {
        try {
            const res = await fetch("/api/goodies");
            if (res.ok) {
                const data = await res.json();
                setGoodies(data);
            }
        } catch (error) {
            console.error("Failed to fetch goodies:", error);
            toast.error("Failed to load goodies");
        } finally {
            setLoading(false);
        }
    };

    const fetchUserCredits = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/users/me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setUserCredits(data.credits || 0);
                setUserTier(data.tier || 'Bronze'); // Fetch tier from database
            }
        } catch (error) {
            console.error("Failed to fetch user credits:", error);
        }
    };

    const fetchPurchaseHistory = async () => {
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch("/api/users/purchases", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setPurchases(data);
            }
        } catch (error) {
            console.error("Failed to fetch purchase history:", error);
        }
    };

    const handlePurchaseClick = (goodie: Goodie) => {
        setSelectedGoodie(goodie);
        setShowPurchaseDialog(true);
    };

    const confirmPurchase = async () => {
        if (!selectedGoodie) return;

        if (userCredits < selectedGoodie.cost) {
            toast.error("Insufficient credits!");
            setShowPurchaseDialog(false);
            return;
        }

        if (selectedGoodie.stock === 0) {
            toast.error("Out of stock!");
            setShowPurchaseDialog(false);
            return;
        }

        setPurchasing(true);
        try {
            const token = localStorage.getItem("auth_token");
            const res = await fetch(`/api/goodies/${selectedGoodie.id}/purchase`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                const data = await res.json();
                toast.success(`Successfully purchased ${selectedGoodie.name}!`);
                setUserCredits(data.credits);

                // Update global user credits in AuthContext
                updateUser({ credits: data.credits });

                fetchGoodies(); // Refresh to update stock
                setShowPurchaseDialog(false);
            } else {
                const error = await res.json();
                toast.error(error.error || "Purchase failed");
            }
        } catch (error) {
            console.error("Purchase failed:", error);
            toast.error("Failed to complete purchase");
        } finally {
            setPurchasing(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            Apparel: "bg-purple-500/10 text-purple-700 dark:text-purple-400",
            Stationery: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
            Digital: "bg-green-500/10 text-green-700 dark:text-green-400",
            Accessories: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
        };
        return colors[category] || "bg-gray-500/10 text-gray-700 dark:text-gray-400";
    };

    return (
        <Layout>
            {/* Hero Section */}
            <section className="gradient-hero-enhanced text-primary-foreground py-12 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                        className="absolute top-10 right-10 w-32 h-32 border border-primary-foreground/20 rounded-full"
                    />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 mb-4"
                            >
                                <Gift className="w-8 h-8" />
                                <h1 className="text-4xl font-bold">Goodies Marketplace</h1>
                            </motion.div>
                            <p className="text-lg text-primary-foreground/80 max-w-2xl">
                                Redeem your hard-earned credits for exclusive Sol-1 merchandise and rewards!
                            </p>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-2xl p-6"
                        >
                            <div className="flex flex-col gap-3">
                                {/* Credits Display */}
                                <div className="flex items-center gap-3">
                                    <Coins className="w-8 h-8 text-yellow-300" />
                                    <div>
                                        <p className="text-sm text-primary-foreground/70">Your Credits</p>
                                        <p className="text-3xl font-bold">{userCredits}</p>
                                    </div>
                                </div>

                                {/* Tier Badge */}
                                <Badge
                                    className={`w-fit ${userTier === 'Platinum' ? 'bg-purple-500 hover:bg-purple-600' :
                                        userTier === 'Gold' ? 'bg-yellow-500 hover:bg-yellow-600' :
                                            userTier === 'Silver' ? 'bg-blue-500 hover:bg-blue-600' :
                                                'bg-orange-500 hover:bg-orange-600'
                                        } text-white`}
                                >
                                    {userTier} Tier
                                </Badge>

                                {/* My Goodies Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        fetchPurchaseHistory();
                                        setShowPurchaseHistory(true);
                                    }}
                                    className="w-full mt-2 bg-primary-foreground/5 hover:bg-primary-foreground/10 border-primary-foreground/20"
                                >
                                    <Package className="w-4 h-4 mr-2" />
                                    My Goodies
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-12 bg-background">
                <div className="container mx-auto px-4">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <Card key={i} className="overflow-hidden">
                                    <Skeleton className="h-48 w-full" />
                                    <CardHeader>
                                        <Skeleton className="h-6 w-3/4" />
                                        <Skeleton className="h-4 w-full" />
                                    </CardHeader>
                                </Card>
                            ))}
                        </div>
                    ) : goodies.length === 0 ? (
                        <div className="text-center py-20">
                            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-2">No Goodies Available</h3>
                            <p className="text-muted-foreground">Check back later for new items!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {goodies.map((goodie, index) => (
                                <motion.div
                                    key={goodie.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                                        <div className="relative h-48 bg-gradient-to-br from-sol-cyan/20 to-sol-navy-light/20">
                                            <img
                                                src={goodie.image_url}
                                                alt={goodie.name}
                                                className="w-full h-full object-cover"
                                            />
                                            <Badge className={`absolute top-2 right-2 ${getCategoryColor(goodie.category)}`}>
                                                {goodie.category}
                                            </Badge>
                                        </div>

                                        <CardHeader className="flex-grow">
                                            <CardTitle className="text-lg">{goodie.name}</CardTitle>
                                            <CardDescription className="line-clamp-2">{goodie.description}</CardDescription>
                                        </CardHeader>

                                        <CardFooter className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-2">
                                                    <Coins className="w-5 h-5 text-yellow-500" />
                                                    <span className="text-xl font-bold text-yellow-600 dark:text-yellow-500">
                                                        {goodie.cost}
                                                    </span>
                                                </div>
                                                {goodie.stock !== -1 && (
                                                    <span className="text-sm text-muted-foreground">
                                                        Stock: {goodie.stock}
                                                    </span>
                                                )}
                                            </div>

                                            <Button
                                                onClick={() => handlePurchaseClick(goodie)}
                                                disabled={
                                                    goodie.stock === 0 || userCredits < goodie.cost
                                                }
                                                className="w-full gap-2"
                                                variant={userCredits >= goodie.cost ? "default" : "outline"}
                                            >
                                                <ShoppingCart className="w-4 h-4" />
                                                {goodie.stock === 0
                                                    ? "Out of Stock"
                                                    : userCredits < goodie.cost
                                                        ? "Insufficient Credits"
                                                        : "Purchase"}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* Purchase Confirmation Dialog */}
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-sol-cyan" />
                            Confirm Purchase
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to purchase this item?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedGoodie && (
                        <div className="py-4">
                            <div className="flex gap-4">
                                <img
                                    src={selectedGoodie.image_url}
                                    alt={selectedGoodie.name}
                                    className="w-24 h-24 object-cover rounded-lg"
                                />
                                <div className="flex-1">
                                    <h4 className="font-semibold">{selectedGoodie.name}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{selectedGoodie.description}</p>
                                    <div className="flex items-center gap-2 mt-3">
                                        <Coins className="w-5 h-5 text-yellow-500" />
                                        <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">
                                            {selectedGoodie.cost} Credits
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-muted rounded-lg">
                                <div className="flex justify-between text-sm">
                                    <span>Current Credits:</span>
                                    <span className="font-semibold">{userCredits}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-1">
                                    <span>After Purchase:</span>
                                    <span className="font-semibold">{userCredits - selectedGoodie.cost}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowPurchaseDialog(false)}
                            disabled={purchasing}
                        >
                            Cancel
                        </Button>
                        <Button onClick={confirmPurchase} disabled={purchasing}>
                            {purchasing ? "Processing..." : "Confirm Purchase"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Purchase History Dialog */}
            <Dialog open={showPurchaseHistory} onOpenChange={setShowPurchaseHistory}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-sol-cyan" />
                            My Goodies
                        </DialogTitle>
                        <DialogDescription>
                            Your purchase history and order details
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {purchases.length === 0 ? (
                            <div className="text-center py-8">
                                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground">No purchases yet</p>
                                <p className="text-sm text-muted-foreground mt-1">Browse the marketplace and get your first goodie!</p>
                            </div>
                        ) : (
                            purchases.map((purchase) => (
                                <Card key={purchase.id} className="overflow-hidden">
                                    <CardHeader className="bg-muted/30 pb-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-xs text-muted-foreground">Order Date</p>
                                                <p className="font-semibold">
                                                    {new Date(purchase.created_at).toLocaleDateString('en-US', {
                                                        month: 'long',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(purchase.created_at).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Order #{purchase.id}</p>
                                                <Badge className="mt-1" variant={purchase.status === 'completed' ? 'default' : 'secondary'}>
                                                    {purchase.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={purchase.image_url}
                                                alt={purchase.goodie_name}
                                                className="w-20 h-20 object-cover rounded-lg"
                                            />
                                            <div className="flex-1">
                                                <h4 className="font-semibold">{purchase.goodie_name}</h4>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {purchase.description}
                                                </p>
                                                <Badge className={`mt-2 ${purchase.category === 'Apparel' ? 'bg-purple-500/10 text-purple-700' :
                                                    purchase.category === 'Stationery' ? 'bg-blue-500/10 text-blue-700' :
                                                        purchase.category === 'Digital' ? 'bg-green-500/10 text-green-700' :
                                                            'bg-orange-500/10 text-orange-700'
                                                    }`} variant="outline">
                                                    {purchase.category}
                                                </Badge>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground">Credits Spent</p>
                                                <div className="flex items-center gap-1 justify-end mt-1">
                                                    <Coins className="w-4 h-4 text-yellow-500" />
                                                    <span className="text-lg font-bold text-yellow-600 dark:text-yellow-500">
                                                        {purchase.cost_paid}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </Layout>
    );
}
