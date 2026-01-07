import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { 
  Users, 
  Phone, 
  MessageCircle, 
  Shield, 
  ChevronRight,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

// Import club logos
import probeLogo from "@/assets/clubs/probe-logo.jpg";
import estoriaLogo from "@/assets/clubs/estoria-logo.jpg";
import crisprLogo from "@/assets/clubs/crispr-logo.jpg";
import crescendoLogo from "@/assets/clubs/crescendo-logo.jpg";
import elevateLogo from "@/assets/clubs/elevate-logo.jpg";
import eklavyaLogo from "@/assets/clubs/eklavya-logo.jpg";
import dotslashLogo from "@/assets/clubs/dotslash-logo.jpg";
import gdgLogo from "@/assets/clubs/gdg-logo.jpg";

interface Club {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  logo: string;
  lead: {
    name: string;
    phone: string;
  };
  coLead: {
    name: string;
    phone: string;
  };
  whatsappLink: string;
  instagramLink?: string;
  memberCount: number;
  verified: boolean;
}

const clubs: Club[] = [
  {
    id: "probe",
    name: "Probe",
    fullName: "Photography Club",
    description: "Campus events coverage, photography walks, and editing workshops. Document campus life creatively.",
    category: "Creative",
    logo: probeLogo,
    lead: { name: "Manu Shrivastava", phone: "+91 82698 83830" },
    coLead: { name: "Akshit Yadav", phone: "+91 73781 02090" },
    whatsappLink: "https://chat.whatsapp.com/probe-iiitn",
    memberCount: 89,
    verified: true,
  },
  {
    id: "estoria",
    name: "Estoria",
    fullName: "Dramatics & Poetry Club",
    description: "Dramatics and poetry club. Theatre performances, poetry slams, creative writing, and storytelling sessions.",
    category: "Cultural",
    logo: estoriaLogo,
    lead: { name: "Mayank Merchandani", phone: "+91 91097 50185" },
    coLead: { name: "Pranay Chiramana", phone: "+91 91312 89543" },
    whatsappLink: "https://chat.whatsapp.com/estoria-iiitn",
    instagramLink: "https://www.instagram.com/estoria_iiitn/",
    memberCount: 98,
    verified: true,
  },
  {
    id: "crispr",
    name: "Crispr",
    fullName: "Innovation & Research Club",
    description: "Innovation and research club. Hardware projects, IoT, embedded systems, and cutting-edge technology exploration.",
    category: "Technical",
    logo: crisprLogo,
    lead: { name: "Vikram Reddy", phone: "+91 99XXX XXXXX" },
    coLead: { name: "Ananya Singh", phone: "+91 85XXX XXXXX" },
    whatsappLink: "https://chat.whatsapp.com/crispr-iiitn",
    instagramLink: "https://www.instagram.com/crispr_iiitn/?hl=en",
    memberCount: 128,
    verified: true,
  },
  {
    id: "crescendo",
    name: "Crescendo",
    fullName: "Music Club",
    description: "Vocals, instruments, and band performances. Regular jamming sessions and event performances.",
    category: "Cultural",
    logo: crescendoLogo,
    lead: { name: "Prathamesh Kale", phone: "+91 79 7298 1473" },
    coLead: { name: "Nithin Karthikeyan", phone: "+91 99083 32350" },
    whatsappLink: "https://chat.whatsapp.com/crescendo-iiitn",
    instagramLink: "https://www.instagram.com/crescendo_iiitn/?hl=en",
    memberCount: 112,
    verified: true,
  },
  {
    id: "elevate",
    name: "Elevate",
    fullName: "Developers Club",
    description: "Developers club focused on full-stack development, UI/UX design, and building real-world projects.",
    category: "Technical",
    logo: elevateLogo,
    lead: { name: "Kavya Nair", phone: "+91 96XXX XXXXX" },
    coLead: { name: "Aditya Kumar", phone: "+91 84XXX XXXXX" },
    whatsappLink: "https://chat.whatsapp.com/elevate-iiitn",
    memberCount: 156,
    verified: true,
  },
  {
    id: "eklavya",
    name: "Eklavya",
    fullName: "E-Sports Club",
    description: "E-Sports club for competitive gaming, tournaments, and LAN parties. Valorant, CS2, and other esports titles.",
    category: "Recreation",
    logo: eklavyaLogo,
    lead: { name: "Aniket Desai", phone: "+91 91XXX XXXXX" },
    coLead: { name: "Tanya Sharma", phone: "+91 79XXX XXXXX" },
    whatsappLink: "https://chat.whatsapp.com/eklavya-iiitn",
    memberCount: 198,
    verified: true,
  },
  {
    id: "dotslash",
    name: "Dotslash",
    fullName: "Coding Club",
    description: "Competitive programming, hackathons, and coding challenges. Regular contests and peer learning sessions.",
    category: "Technical",
    logo: dotslashLogo,
    lead: { name: "Shubham Jee Shrivastava", phone: "+91 76440 88095" },
    coLead: { name: "Sambodhi Bhovai", phone: "+91 78660 53115" },
    whatsappLink: "https://chat.whatsapp.com/dotslash-iiitn",
    instagramLink: "https://www.instagram.com/thedotslashcommunity/",
    memberCount: 245,
    verified: true,
  },
  {
    id: "gdg",
    name: "GDG Club",
    fullName: "Google Developer Groups Club",
    description: "Google Developer Group. Workshops on Google technologies, Android, Cloud, and ML.",
    category: "Technical",
    logo: gdgLogo,
    lead: { name: "Rahul Verma", phone: "+91 97XXX XXXXX" },
    coLead: { name: "Sneha Iyer", phone: "+91 86XXX XXXXX" },
    whatsappLink: "https://chat.whatsapp.com/gdg-iiitn",
    instagramLink: "https://www.instagram.com/gdg_iiitn/?hl=en",
    memberCount: 312,
    verified: true,
  },
  {
    id: "orator",
    name: "Orator",
    fullName: "Literary Club",
    description: "Literary club for debates, quizzes, creative writing, and public speaking. Build communication and presentation skills.",
    category: "Cultural",
    logo: undefined as unknown as string,
    lead: { name: "Tanuj Game", phone: "+91 74990 69258" },
    coLead: { name: "Shreyam Prashar", phone: "+91 99104 22844" },
    whatsappLink: "https://chat.whatsapp.com/orator-iiitn",
    instagramLink: "https://www.instagram.com/orator_iiitn/?hl=en",
    memberCount: 76,
    verified: true,
  },
];

const categories = ["All", "Technical", "Creative", "Cultural", "Recreation"];

function ClubCard({ club, onSelect }: { club: Club; onSelect: (club: Club) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="card-hover bg-card border border-border rounded-xl p-6 cursor-pointer group"
      onClick={() => onSelect(club)}
    >
      <div className="flex items-start justify-between mb-4">
        {/* Club Logo */}
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.1 }}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group-hover:shadow-lg transition-all overflow-hidden border-2 border-border"
        >
          {club.logo ? (
            <img 
              src={club.logo} 
              alt={`${club.name} logo`} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-sol-cyan">{club.name.charAt(0)}</span>
          )}
        </motion.div>
        {club.verified && (
          <div className="flex items-center gap-1 text-xs font-medium text-sol-verified bg-sol-verified/10 px-2 py-1 rounded-full border border-sol-verified/20">
            <Shield className="w-3 h-3" />
            Verified
          </div>
        )}
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-sol-cyan transition-colors">{club.name}</h3>
      <p className="text-xs text-sol-cyan mb-2">{club.fullName}</p>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{club.description}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{club.memberCount} members</span>
        </div>
        <span className="text-xs font-medium text-sol-cyan bg-sol-cyan/10 px-2 py-1 rounded-full group-hover:bg-sol-cyan group-hover:text-white transition-all border border-sol-cyan/20 group-hover:border-sol-cyan">
          {club.category}
        </span>
      </div>
    </motion.div>
  );
}

function ClubDetail({ club, onBack }: { club: Club; onBack: () => void }) {
  const formatPhoneForCall = (phone: string) => {
    return phone.replace(/\s/g, '');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-sol-cyan transition-colors mb-6 group"
      >
        <ChevronRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to all clubs
      </button>
      
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="gradient-hero-enhanced p-8 text-primary-foreground">
          <div className="flex items-center gap-4">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm overflow-hidden border-2 border-primary-foreground/30"
            >
              {club.logo ? (
                <img 
                  src={club.logo} 
                  alt={`${club.name} logo`} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold">{club.name.charAt(0)}</span>
              )}
            </motion.div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{club.name}</h1>
                {club.verified && (
                  <div className="flex items-center gap-1 text-xs font-medium bg-primary-foreground/20 px-2 py-1 rounded-full backdrop-blur-sm">
                    <Shield className="w-3 h-3" />
                    Institute Verified
                  </div>
                )}
              </div>
              <p className="text-primary-foreground/90 font-medium">{club.fullName}</p>
              <p className="text-primary-foreground/70 text-sm">{club.category} Club • {club.memberCount} members</p>
            </div>
          </div>
        </div>
        
        <div className="p-8">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-3">About</h2>
            <p className="text-muted-foreground">{club.description}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-lg font-semibold text-foreground mb-4">Club Leadership</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4 border border-border hover:border-sol-cyan/30 transition-all"
              >
                <div className="text-xs font-medium text-sol-cyan mb-2">Club Lead</div>
                <div className="font-semibold text-foreground mb-2">{club.lead.name}</div>
                <a 
                  href={`tel:${formatPhoneForCall(club.lead.phone)}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sol-cyan transition-colors group"
                >
                  <Phone className="w-4 h-4 group-hover:animate-pulse" />
                  <span className="font-mono">{club.lead.phone}</span>
                </a>
              </motion.div>
              
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4 border border-border hover:border-sol-cyan/30 transition-all"
              >
                <div className="text-xs font-medium text-sol-cyan mb-2">Co-Lead</div>
                <div className="font-semibold text-foreground mb-2">{club.coLead.name}</div>
                <a 
                  href={`tel:${formatPhoneForCall(club.coLead.phone)}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-sol-cyan transition-colors group"
                >
                  <Phone className="w-4 h-4 group-hover:animate-pulse" />
                  <span className="font-mono">{club.coLead.phone}</span>
                </a>
              </motion.div>
            </div>
          </motion.div>

          {/* Instagram Section */}
          {club.instagramLink && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Follow Us</h2>
              <a
                href={club.instagramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-lg px-5 py-3 hover:from-purple-500/20 hover:via-pink-500/20 hover:to-orange-500/20 transition-all group shadow-sm"
              >
                <Instagram className="w-5 h-5 text-pink-500" />
                <span className="font-medium text-foreground">@{club.instagramLink.split('/').filter(Boolean).pop()?.replace('?hl=en', '')}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-pink-500 transition-colors" />
              </a>
            </motion.div>
          )}
          
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-sol-cyan/5 to-sol-cyan/10 border border-sol-cyan/20 rounded-lg p-6"
          >
            <h2 className="text-lg font-semibold text-foreground mb-3">Join This Club</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Connect with {club.name} through the official WhatsApp group. This link is verified by the institute.
            </p>
            <a
              href={club.whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block"
            >
              <Button variant="accent" className="gap-2 btn-hover shadow-md">
                <MessageCircle className="w-4 h-4" />
                Join WhatsApp Group
                <ExternalLink className="w-3 h-3" />
              </Button>
            </a>
            <p className="text-xs text-muted-foreground mt-3">
              Note: Only IIIT Nagpur students with valid @iiitn.ac.in email can join.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Clubs() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  
  const filteredClubs = clubs.filter(
    (club) => selectedCategory === "All" || club.category === selectedCategory
  );
  
  return (
    <Layout>
      <section className="gradient-hero-enhanced text-primary-foreground py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 bg-primary-foreground/10 border border-primary-foreground/20 rounded-full px-4 py-2 mb-4 backdrop-blur-sm">
              <Shield className="w-4 h-4" />
              <span className="text-sm font-medium">Institute Verified Directory</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Campus Clubs
            </h1>
            <p className="text-lg text-primary-foreground/80">
              Official directory of all IIIT Nagpur clubs. Find your community, connect with leads, and join activities.
            </p>
          </motion.div>
        </div>
      </section>
      
      <section className="py-12 bg-cyan-gradient min-h-screen">
        <div className="container mx-auto px-4">
          {selectedClub ? (
            <ClubDetail club={selectedClub} onBack={() => setSelectedClub(null)} />
          ) : (
            <>
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-8">
                {categories.map((category) => (
                  <motion.div
                    key={category}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant={selectedCategory === category ? "accent" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="btn-hover filter-hover"
                    >
                      {category}
                    </Button>
                  </motion.div>
                ))}
              </div>
              
              {/* Clubs Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredClubs.map((club, index) => (
                  <motion.div
                    key={club.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <ClubCard club={club} onSelect={setSelectedClub} />
                  </motion.div>
                ))}
              </div>
              
              {filteredClubs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No clubs found in this category.</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
