import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src="/sol1-logo.jpg"
                alt="SOL-1"
                className="w-10 h-10 rounded-lg object-contain"
              />
              <span className="font-bold text-lg">Sol-1</span>
            </div>
            <p className="text-primary-foreground/70 text-sm">
              Internal knowledge system for IIIT Nagpur students. Built by students, for students.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/explore" className="hover:text-primary-foreground transition-colors">Explore Questions</Link></li>
              <li><Link to="/contribute" className="hover:text-primary-foreground transition-colors">Contribute Answers</Link></li>
              <li><Link to="/clubs" className="hover:text-primary-foreground transition-colors">Clubs</Link></li>
              <li><Link to="/leaderboard" className="hover:text-primary-foreground transition-colors">Leaderboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/guidelines" className="hover:text-primary-foreground transition-colors">Guidelines</Link></li>
              <li><Link to="/report-issue" className="hover:text-primary-foreground transition-colors">Report Issue</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>IIIT Nagpur</li>
              <li>Survey No. 140, 141/1</li>
              <li>Behind Br. Sheshrao Wankhede Shetkari Sahkari Soot Girni</li>
              <li>Nagpur, Maharashtra 441108</li>
              <li className="pt-2">
                <a
                  href="https://www.iiitn.ac.in/pages/directory"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sol-cyan hover:text-primary-foreground transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  IIIT Nagpur Directory
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>© {new Date().getFullYear()} Sol-1. Exclusively for IIIT Nagpur students.</p>
        </div>
      </div>
    </footer>
  );
}
