import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useState } from "react";

// 2026 Indian Calendar Holidays
const holidays2026 = [
  { date: "2026-01-14", name: "Makar Sankranti" },
  { date: "2026-01-26", name: "Republic Day" },
  { date: "2026-03-14", name: "Holi" },
  { date: "2026-04-14", name: "Ambedkar Jayanti" },
  { date: "2026-04-21", name: "Ram Navami" },
  { date: "2026-05-01", name: "May Day" },
  { date: "2026-05-07", name: "Buddha Purnima" },
  { date: "2026-06-17", name: "Eid ul-Fitr" },
  { date: "2026-07-17", name: "Muharram" },
  { date: "2026-08-15", name: "Independence Day" },
  { date: "2026-08-24", name: "Eid ul-Adha" },
  { date: "2026-08-26", name: "Janmashtami" },
  { date: "2026-09-16", name: "Milad un-Nabi" },
  { date: "2026-10-02", name: "Gandhi Jayanti" },
  { date: "2026-10-15", name: "Dussehra" },
  { date: "2026-11-04", name: "Diwali" },
  { date: "2026-11-05", name: "Govardhan Puja" },
  { date: "2026-11-06", name: "Bhai Dooj" },
  { date: "2026-11-30", name: "Guru Nanak Jayanti" },
  { date: "2026-12-25", name: "Christmas" },
];

export function CommunityCalendar({ onBack }: { onBack?: () => void }) {
  const [currentMonth, setCurrentMonth] = useState(0); // January 2026
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const getDaysInMonth = (month: number) => {
    return new Date(2026, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (month: number) => {
    return new Date(2026, month, 1).getDay();
  };
  
  const isWeekend = (day: number, month: number) => {
    const date = new Date(2026, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };
  
  const getHoliday = (day: number, month: number) => {
    const dateStr = `2026-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays2026.find(h => h.date === dateStr);
  };
  
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      <button
        onClick={onBack}
        className={`flex items-center gap-2 text-muted-foreground hover:text-sol-cyan transition-colors mb-6 group ${!onBack ? 'invisible' : ''}`}
      >
        <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </button>
      
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg">
        <div className="gradient-hero-enhanced p-6 text-primary-foreground">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Academic Calendar 2026</h1>
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentMonth(Math.max(0, currentMonth - 1))}
                disabled={currentMonth === 0}
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </motion.button>
              <span className="font-semibold min-w-[120px] text-center">{months[currentMonth]} 2026</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCurrentMonth(Math.min(11, currentMonth + 1))}
                disabled={currentMonth === 11}
                className="p-2 rounded-lg bg-primary-foreground/10 hover:bg-primary-foreground/20 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div key={day} className={`text-center font-semibold py-2 ${i === 0 || i === 6 ? 'text-destructive' : 'text-foreground'}`}>
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty cells for days before first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="h-20" />
            ))}
            
            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const weekend = isWeekend(day, currentMonth);
              const holiday = getHoliday(day, currentMonth);
              
              return (
                <motion.div
                  key={day}
                  whileHover={{ scale: 1.05 }}
                  className={`h-20 rounded-lg border p-2 cursor-default transition-colors ${
                    weekend 
                      ? 'bg-destructive/10 border-destructive/20 text-destructive' 
                      : holiday 
                        ? 'bg-sol-cyan/10 border-sol-cyan/30' 
                        : 'bg-card border-border hover:border-sol-cyan/30'
                  }`}
                >
                  <div className={`font-semibold ${weekend ? 'text-destructive' : 'text-foreground'}`}>
                    {day}
                  </div>
                  {holiday && (
                    <div className="text-xs text-sol-cyan mt-1 line-clamp-2">
                      {holiday.name}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
          
          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-destructive/20 border border-destructive/30" />
              <span className="text-muted-foreground">Weekend</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-sol-cyan/20 border border-sol-cyan/30" />
              <span className="text-muted-foreground">Holiday</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
